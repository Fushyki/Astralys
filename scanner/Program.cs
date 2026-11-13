using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Reflection;
using System.Text.Json;
using Tesseract;

// Scanner de artefatos do Astralys. Le so artefatos, so a imagem da tela; nao usa rede nem memoria do jogo.
record Layout(int Cols, int Rows, double GridX0, double GridY0, double Dx, double Dy, Box Detail, Box Top, Box Level, Box Low, int ScrollNotches);
record Box(double X, double Y, double W, double H);

static class Program
{
    const string Version = "0.1.0";
    static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, WriteIndented = true, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };
    static readonly string Dir = AppContext.BaseDirectory;
    static readonly string LogPath = Path.Combine(Dir, "astralys-scanner.log");

    public static Action<string>? Sink; // janela: recebe as mensagens no lugar do console
    public static volatile bool Cancel;
    [System.Runtime.InteropServices.DllImport("kernel32.dll")] static extern bool AttachConsole(int pid);
    static void Log(string s) { if (Sink != null) Sink(s); else Console.WriteLine(s); try { File.AppendAllText(LogPath, $"{DateTime.Now:HH:mm:ss} {s}\n"); } catch { } }
    public static List<SetName> Sets() => JsonSerializer.Deserialize<List<SetName>>(Res("sets.json"), Json)!;
    static string Res(string name) { using var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name)!; using var r = new StreamReader(s); return r.ReadToEnd(); }
    static int Fail(string erro, string solucao) { Log($"\nERRO: {erro}\n  O que fazer: {solucao}"); Pause(); return 1; }
    static void Pause() { if (Sink != null) return; try { Console.WriteLine("\nPressione Enter para fechar."); Console.ReadLine(); } catch { } }
    static string? Arg(string[] a, string k) { var i = Array.IndexOf(a, k); return i >= 0 && i + 1 < a.Length ? a[i + 1] : null; }

    [STAThread]
    static int Main(string[] args)
    {
        if (args.Length == 0) { Application.EnableVisualStyles(); Application.Run(new Gui()); return 0; } // dois cliques: abre a janela
        AttachConsole(-1); // WinExe: usa o console de quem chamou
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        var sets = JsonSerializer.Deserialize<List<SetName>>(Res("sets.json"), Json)!;
        if (args.Contains("--selftest")) return SelfTest(sets);
        return Scan(args, sets);
    }

    public static int Scan(string[] args, List<SetName> sets)
    {
        Log($"Astralys Scanner {Version}. Leitura de artefatos pela imagem da tela. Nada é enviado pela internet.");
        int minLevel = int.Parse(Arg(args, "--min-level") ?? "0"), minRarity = int.Parse(Arg(args, "--min-rarity") ?? "1");
        bool sortedByLevel = args.Contains("--sorted-by-level"), keep = args.Contains("--keep");
        var layout = JsonSerializer.Deserialize<Layout>(Arg(args, "--layout") is { } lp ? File.ReadAllText(lp) : Res("layout.json"), Json)!;

        if (Arg(args, "--image") is { } img) return ImageTest(img, layout, sets);

        // Verificação antes de iniciar: só começa com tudo certo.
        if (!Native.IsAdmin) return Fail("Sem permissão para clicar no jogo.", "Feche o scanner e abra de novo com \"Executar como administrador\".");
        var game = Native.FindGame();
        if (game == IntPtr.Zero) return Fail("Não encontrei o jogo.", "Abra o Genshin Impact e deixe a janela aberta (não minimizada).");
        if (Native.Minimized(game)) return Fail("O jogo está minimizado.", "Traga a janela do jogo para a frente e rode de novo.");
        var (w, h) = Native.ClientSize(game);
        if (w < 1280 || h < 720) return Fail($"A janela do jogo é pequena demais ({w}x{h}).", "Aumente a janela do jogo para pelo menos 1280x720.");
        Native.Focus(game); Thread.Sleep(400);
        using (var probe = Native.Capture(game))
            if (IsBlack(probe)) return Fail("O jogo está em tela cheia exclusiva (a imagem veio preta).", "Nas configurações gráficas, troque para Janela ou Janela sem bordas.");

        var tess = Path.Combine(Path.GetTempPath(), "astralys-tessdata");
        Directory.CreateDirectory(tess);
        using (var s = Assembly.GetExecutingAssembly().GetManifestResourceStream("eng.traineddata")!) using (var f = File.Create(Path.Combine(tess, "eng.traineddata"))) s.CopyTo(f);
        // 3 motores de OCR: a leitura de um artefato roda em segundo plano enquanto o scanner ja clica no proximo.
        var engines = Enumerable.Range(0, 3).Select(_ => new TesseractEngine(tess, "eng", EngineMode.LstmOnly)).ToList();
        var free = new System.Collections.Concurrent.BlockingCollection<TesseractEngine>(); foreach (var e in engines) free.Add(e);

        Log($"Janela do jogo: {w}x{h}. Filtros: nível mínimo {minLevel}, raridade mínima {minRarity}. Para parar a qualquer momento: aperte a tecla Esc.");
        Log("Não mexa no mouse nem no teclado até terminar.");
        Thread.Sleep(1500);

        var found = new List<Artifact>(); var uncertain = 0;
        int Px(double f, int total) => (int)Math.Round(f * total);
        byte[] DetailHash() { using var b = Native.Capture(game); using var c = Crop(b, layout.Detail); return Hash(c); }

        bool stop = false, done = false; int idle = 0; string? lastSig = null; byte[]? prev = null;
        var pending = new Queue<Task<Artifact>>();
        // Trata os resultados na ordem dos cliques (repetidos, nivel minimo, filtros).
        void Drain(bool all)
        {
            while (pending.Count > 0 && (all || pending.Peek().IsCompleted))
            {
                var a = pending.Dequeue().Result; if (done) continue;
                var sig = $"{a.SetKey}|{a.SlotKey}|{a.MainStatKey}|{a.Level}|{string.Join(',', a.Substats.Select(x => x.Key + x.Value))}";
                if (sig == lastSig) continue;
                lastSig = sig;
                if (sortedByLevel && a.Level is int lv && lv < minLevel) { Log("Chegou abaixo do nível mínimo: terminando."); stop = done = true; continue; }
                if ((a.Level ?? 99) < minLevel || a.Rarity < minRarity) continue;
                if (a.Notes.Count > 0) uncertain++;
                found.Add(a);
                Log($"{found.Count}: {a.SetKey} {a.SlotKey} +{a.Level} {a.MainStatKey}{(a.Notes.Count > 0 ? "  (conferir: " + string.Join(' ', a.Notes) + ")" : "")}");
            }
        }
        // Posicao das linhas em pixels: a linha global "a" fica em y0 + a*dy - off (off = quanto a lista ja rolou).
        double dyPx = layout.Dy * h, y0 = layout.GridY0 * h, yMax = y0 + (layout.Rows - 1) * dyPx + 0.12 * dyPx;
        var gridBox = new Box(layout.GridX0 - layout.Dx / 2, layout.GridY0 - layout.Dy / 2, layout.Dx * layout.Cols, layout.Dy * layout.Rows);
        byte[][] Grid() { using var b = Native.Capture(game); using var c = Crop(b, gridBox); return Gray(c); }
        byte[][] SettleGrid() { Thread.Sleep(150); var g = Grid(); for (int i = 0; i < 20; i++) { Thread.Sleep(60); var g2 = Grid(); if (GridSame(g, g2, 1.0)) return g2; g = g2; } return g; }
        // Rola a lista: arrasta para cima (quantidade certa) e mede quanto andou. 0 = fim da lista, -1 = nao consegui medir.
        double ScrollList()
        {
            var before = Grid(); double D = (layout.Rows - 1.25) * dyPx; // sobra margem se o jogo arrastar um pouco além
            int sx = Px(layout.GridX0 + layout.Dx * 3, w), yFrom = (int)Math.Round(y0 + (layout.Rows - 1) * dyPx);
            for (int attempt = 0; attempt < 2; attempt++)
            {
                if (attempt == 0) Native.Drag(game, sx, yFrom, (int)Math.Round(yFrom - D)); else Native.Scroll(game, sx, (int)Math.Round(y0 + dyPx * 1.5), 3); // reserva: roda do mouse
                var after = SettleGrid();
                if (GridSame(before, after, 3)) continue;
                return Shift(before, after, D) is int s ? s : -1;
            }
            return 0;
        }
        int dumps = 0; var dbg = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "astralys-scanner-debug");
        void Dump(Bitmap b, string name) { try { Directory.CreateDirectory(dbg); b.Save(Path.Combine(dbg, name), System.Drawing.Imaging.ImageFormat.Png); } catch { } }

        int nextRow = 0; double off = 0;
        while (!stop)
        {
            for (int a = nextRow; y0 + a * dyPx - off <= yMax && !stop; a++)
            {
                int cy = (int)Math.Round(y0 + a * dyPx - off);
                for (int c = 0; c < layout.Cols; c++)
                {
                    if (Native.EscPressed || Cancel) { Log("Parado pela tecla Esc."); stop = true; break; }
                    if (!Native.InFront(game)) { Log("O jogo saiu da frente: parei. Volte ao início da lista e inicie de novo."); stop = true; break; }
                    var before = prev ??= DetailHash();
                    Native.Click(game, Px(layout.GridX0 + c * layout.Dx, w), cy);
                    var changed = false; var cur = before;
                    for (int t = 0; t < 60 && !changed; t++) { Thread.Sleep(15); cur = DetailHash(); changed = !cur.SequenceEqual(before); }
                    prev = cur;
                    if (!changed) { if (++idle >= 3) { stop = true; break; } continue; }
                    idle = 0;
                    // O painel anima ao trocar de artefato: espera parar de mudar (duas capturas iguais) antes de ler.
                    var frame = Native.Capture(game); byte[] hp; using (var c0 = Crop(frame, layout.Detail)) hp = Hash(c0);
                    for (int t = 0; t < 24; t++)
                    {
                        Thread.Sleep(25); var f2 = Native.Capture(game); byte[] hn; using (var c1 = Crop(f2, layout.Detail)) hn = Hash(c1);
                        frame.Dispose(); frame = f2; if (Close(hp, hn, 2)) break; hp = hn;
                    }
                    prev = hp;
                    pending.Enqueue(Task.Run(() =>
                    {
                        var e = free.Take();
                        try
                        {
                            var art = Parser.Parse(ReadPanel(frame, e, layout), sets);
                            if (art.Level == null && Interlocked.Increment(ref dumps) <= 4) Dump(frame, $"nivel-nao-lido-{dumps}.png"); // para ver o que o scanner enxergou
                            return art;
                        }
                        finally { free.Add(e); frame.Dispose(); }
                    }));
                    if (pending.Count >= 4) pending.Peek().Wait();
                    Drain(false);
                    if (stop) break;
                }
                nextRow = a + 1;
            }
            if (stop) break;
            var s = ScrollList();
            if (s == 0) break; // fim da lista
            if (s < 0) { Log("Não consegui medir a rolagem da lista: parei. Confira se a lista está visível e sem nada por cima."); using var fb = Native.Capture(game); Dump(fb, "rolagem-falhou.png"); break; }
            off += s;
        }

        Drain(true); foreach (var e in engines) e.Dispose();
        var outPath = Arg(args, "--out") ?? Path.Combine(Dir, "astralys-artefatos.json");
        var good = new { format = "GOOD", version = 2, source = "AstralysScanner " + Version, artifacts = found.Select(a => new { setKey = a.SetKey, slotKey = a.SlotKey, level = a.Level ?? 0, rarity = a.Rarity, mainStatKey = a.MainStatKey, location = "", lock_ = false, substats = a.Substats.Select(s => new { key = s.Key, value = s.Value }), astralysNotes = a.Notes.Count > 0 ? a.Notes : null }) };
        File.WriteAllText(outPath, JsonSerializer.Serialize(good, Json).Replace("\"lock_\"", "\"lock\""));
        Log($"\nPronto: {found.Count} artefatos ({uncertain} para conferir). Arquivo: {outPath}");
        Log("Importe esse arquivo na aba Inventário do Astralys.");
        if (!keep && Sink == null) SelfDelete();
        Pause();
        return 0;
    }

    static Bitmap Crop(Bitmap b, Box f) => b.Clone(new Rectangle((int)(f.X * b.Width), (int)(f.Y * b.Height), (int)(f.W * b.Width), (int)(f.H * b.Height)), b.PixelFormat);
    /// Isola texto branco (canal minimo alto) em fundo colorido: pixels claros viram preto, o resto branco. Le "HP 4,780" e "+20".
    static Bitmap PrepareWhite(Bitmap src, int min = 190)
    {
        using var big = new Bitmap(src.Width * 2, src.Height * 2); using (var g = Graphics.FromImage(big)) { g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.DrawImage(src, 0, 0, big.Width, big.Height); }
        var bits = big.LockBits(new Rectangle(0, 0, big.Width, big.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var buf = new byte[bits.Stride * big.Height]; System.Runtime.InteropServices.Marshal.Copy(bits.Scan0, buf, 0, buf.Length);
        for (int i = 0; i < buf.Length; i += 4) { var v = Math.Min(buf[i], Math.Min(buf[i + 1], buf[i + 2])) >= min ? (byte)0 : (byte)255; buf[i] = buf[i + 1] = buf[i + 2] = v; buf[i + 3] = 255; }
        System.Runtime.InteropServices.Marshal.Copy(buf, 0, bits.Scan0, buf.Length); big.UnlockBits(bits);
        return new Bitmap(big);
    }
    static Bitmap Prepare(Bitmap src, bool invert = true)
    {
        var big = new Bitmap(src.Width * 2, src.Height * 2); using var g = Graphics.FromImage(big);
        float k = invert ? -1f : 1f, o = invert ? 1f : 0f; var m = new ColorMatrix(new[] { new[] { .3f * k, .3f * k, .3f * k, 0, 0 }, new[] { .59f * k, .59f * k, .59f * k, 0, 0 }, new[] { .11f * k, .11f * k, .11f * k, 0, 0 }, new float[] { 0, 0, 0, 1, 0 }, new float[] { o, o, o, 0, 1 } }); // cinza invertido: texto escuro em fundo claro
        using var at = new ImageAttributes(); at.SetColorMatrix(m);
        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
        g.DrawImage(src, new Rectangle(0, 0, big.Width, big.Height), 0, 0, src.Width, src.Height, GraphicsUnit.Pixel, at);
        return big;
    }
    static string Ocr(TesseractEngine engine, Bitmap prepared, PageSegMode mode)
    {
        using var ms = new MemoryStream(); prepared.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
        using var pix = Pix.LoadFromMemory(ms.ToArray()); using var page = engine.Process(pix, mode); return page.GetText();
    }

    /// Le o painel do artefato em 3 recortes (cada um precisa de um preparo diferente): topo (titulo, posicao, atributo principal; texto branco),
    /// nivel (caixa escura com "+20") e a parte de baixo (substatus e set; texto escuro em fundo claro). A ordem do texto e topo, nivel, baixo.
    static string ReadPanel(Bitmap frame, TesseractEngine engine, Layout l)
    {
        using var top = PrepareWhite(Crop(frame, l.Top), 190); using var lvl = PrepareWhite(PillOf(Crop(frame, l.Level)), 200); using var low = Prepare(Crop(frame, l.Low));
        var topText = Ocr(engine, top, PageSegMode.Auto);
        // So "+" e digitos: sem isso a caixa escura do nivel vira lixo ("4200"). Devolve "+NN" para o parser.
        engine.SetVariable("tessedit_char_whitelist", "+0123456789");
        var lvText = Ocr(engine, lvl, PageSegMode.SingleLine);
        engine.SetVariable("tessedit_char_whitelist", "");
        var lm = System.Text.RegularExpressions.Regex.Match(lvText, @"\d{1,2}");
        if (lm.Success && int.Parse(lm.Value) <= 20) lvText = "+" + lm.Value;
        return topText + "\n" + lvText + "\n" + Ocr(engine, low, PageSegMode.Auto);
    }

    /// Recorta a caixa escura do nivel ("+20") dentro do recorte; se nao achar, devolve o recorte todo.
    static Bitmap PillOf(Bitmap b)
    {
        int x0 = b.Width, y0 = b.Height, x1 = -1, y1 = -1;
        for (int y = 0; y < b.Height; y++) for (int x = 0; x < b.Width; x++) { var c = b.GetPixel(x, y); if (Math.Max(c.R, Math.Max(c.G, c.B)) < 120) { x0 = Math.Min(x0, x); x1 = Math.Max(x1, x); y0 = Math.Min(y0, y); y1 = Math.Max(y1, y); } }
        return x1 - x0 >= b.Width / 5 && y1 - y0 >= b.Height / 5 ? b.Clone(new Rectangle(x0, y0, x1 - x0 + 1, y1 - y0 + 1), b.PixelFormat) : b;
    }
    static bool Close(byte[] a, byte[] b, int tol = 8) { long d = 0; for (int i = 0; i < a.Length; i++) d += Math.Abs(a[i] - b[i]); return d / a.Length < tol; }
    /// Cinza do recorte em resolucao total (uma linha de bytes por linha da imagem).
    public static byte[][] Gray(Bitmap c)
    {
        var bd = c.LockBits(new Rectangle(0, 0, c.Width, c.Height), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        var buf = new byte[bd.Stride * c.Height]; System.Runtime.InteropServices.Marshal.Copy(bd.Scan0, buf, 0, buf.Length); c.UnlockBits(bd);
        var g = new byte[c.Height][];
        for (int y = 0; y < c.Height; y++) { g[y] = new byte[c.Width]; for (int x = 0; x < c.Width; x++) { int o = y * bd.Stride + x * 3; g[y][x] = (byte)((buf[o] + buf[o + 1] + buf[o + 2]) / 3); } }
        return g;
    }
    /// 1/4 do tamanho (media de blocos 4x4): busca grossa rapida.
    public static byte[][] Down(byte[][] g) => Enumerable.Range(0, g.Length / 4).Select(y => Enumerable.Range(0, g[0].Length / 4).Select(x => { int s = 0; for (int dy = 0; dy < 4; dy++) for (int dx = 0; dx < 4; dx++) s += g[y * 4 + dy][x * 4 + dx]; return (byte)(s / 16); }).ToArray()).ToArray();
    /// Deslocamento em pixels reais (resolucao total), com erro de ~1 px: busca grossa em 1/4 e refina em volta.
    public static int? Shift(byte[][] a, byte[][] b, double expectPx)
    {
        if (FindShift(Down(a), Down(b), expectPx / 4) is not int s4) return null;
        return Enumerable.Range(Math.Max(1, s4 * 4 - 5), 11).Where(s => s < a.Length).OrderBy(s => GridDiff(a, b, s)).First();
    }
    static double GridDiff(byte[][] a, byte[][] b, int shift) { long d = 0; int H = a.Length, W = a[0].Length; for (int y = 0; y < H - shift; y++) for (int x = 0; x < W; x++) d += Math.Abs(a[y + shift][x] - b[y][x]); return d / (double)((H - shift) * W); }
    static bool GridSame(byte[][] a, byte[][] b, double tol) => GridDiff(a, b, 0) < tol;
    /// Quantas linhas de pixel (na escala 1/4) o conteudo subiu entre as duas imagens. Procura ate 1,3x o esperado; empate (linhas iguais) fica com o mais perto do esperado.
    public static int? FindShift(byte[][] a, byte[][] b, double expect)
    {
        int maxS = Math.Min((int)(expect * 1.3), (int)(a.Length * 0.75)); if (maxS < 1) return null;
        var sc = new double[maxS + 1]; for (int s = 1; s <= maxS; s++) sc[s] = GridDiff(a, b, s);
        var min = sc.Skip(1).Min(); if (min > 12) return null;
        return Enumerable.Range(1, maxS).Where(s => sc[s] <= min * 1.1 + 0.5).OrderBy(s => Math.Abs(s - expect)).First();
    }
    static byte[] Hash(Bitmap b) { using var s = new Bitmap(b, 32, 32); var d = new byte[32 * 32]; for (int y = 0; y < 32; y++) for (int x = 0; x < 32; x++) d[y * 32 + x] = (byte)(s.GetPixel(x, y).GetBrightness() * 255); return d; }
    static bool IsBlack(Bitmap b) { for (int y = 0; y < b.Height; y += b.Height / 12) for (int x = 0; x < b.Width; x += b.Width / 12) if (b.GetPixel(x, y).GetBrightness() > 0.03) return false; return true; }

    static void SelfDelete()
    {
        var exe = Environment.ProcessPath; if (exe == null || exe.EndsWith("dotnet.exe", StringComparison.OrdinalIgnoreCase)) return;
        Process.Start(new ProcessStartInfo("cmd.exe", $"/c ping 127.0.0.1 -n 3 >nul & del /f /q \"{exe}\"") { CreateNoWindow = true, UseShellExecute = false });
    }

    // Valida a calibracao sobre um print do inventario: le o painel e desenha os pontos de clique da grade.
    static int ImageTest(string path, Layout layout, List<SetName> sets)
    {
        var tess = Path.Combine(Path.GetTempPath(), "astralys-tessdata"); Directory.CreateDirectory(tess);
        using (var rs = Assembly.GetExecutingAssembly().GetManifestResourceStream("eng.traineddata")!) using (var f = File.Create(Path.Combine(tess, "eng.traineddata"))) rs.CopyTo(f);
        using var bmp = new Bitmap(path);
        using var engine = new TesseractEngine(tess, "eng", EngineMode.LstmOnly);
        var text = ReadPanel(bmp, engine, layout);
        Console.WriteLine("--- texto lido ---" + Environment.NewLine + text + "--- artefato ---");
        Console.WriteLine(JsonSerializer.Serialize(Parser.Parse(text, sets), Json));
        using (var g = Graphics.FromImage(bmp))
        {
            for (int r = 0; r < layout.Rows; r++) for (int c = 0; c < layout.Cols; c++) g.FillEllipse(Brushes.Lime, (int)((layout.GridX0 + c * layout.Dx) * bmp.Width) - 6, (int)((layout.GridY0 + r * layout.Dy) * bmp.Height) - 6, 12, 12);
            g.DrawRectangle(new Pen(Color.Red, 3), (int)(layout.Detail.X * bmp.Width), (int)(layout.Detail.Y * bmp.Height), (int)(layout.Detail.W * bmp.Width), (int)(layout.Detail.H * bmp.Height));
        }
        var outp = Path.ChangeExtension(path, null) + ".calibracao.png"; bmp.Save(outp, System.Drawing.Imaging.ImageFormat.Png); Console.WriteLine("Imagem de conferência: " + outp);
        return 0;
    }

    // Autoteste do parser (sem o jogo): texto no formato do painel do artefato.
    static int SelfTest(List<SetName> sets)
    {
        var a = Parser.Parse("Gladiator's Nostrum\nSands\nEnergy Recharge\n51.8%\n+20\nCRIT Rate 3.9%\nHP 538\nATK 5.8%\nCRIT DMG 14.8%\nGladiator's Finale (2)\n2-Piece Set: ATK +18%", sets);
        var ok = a.SetKey == "GladiatorsFinale" && a.SlotKey == "sands" && a.MainStatKey == "enerRech_" && a.Level == 20 && a.Substats.Count == 4
              && a.Substats.Any(s => s.Key == "critDMG_" && s.Value == 14.8);
        Console.WriteLine(ok ? "parser OK" : "parser FALHOU: " + JsonSerializer.Serialize(a));
        // OCR: desenha texto, le com o Tesseract e passa pelo parser.
        var tess = Path.Combine(Path.GetTempPath(), "astralys-tessdata"); Directory.CreateDirectory(tess);
        using (var rs = Assembly.GetExecutingAssembly().GetManifestResourceStream("eng.traineddata")!) using (var f = File.Create(Path.Combine(tess, "eng.traineddata"))) rs.CopyTo(f);
        using var bmp = new Bitmap(700, 260); using (var g = Graphics.FromImage(bmp)) { g.Clear(Color.White); g.DrawString("Sands\nEnergy Recharge 51.8%\n+20\nCRIT DMG 14.8%\nHP 538\nATK 5.8%\nGladiator's Finale", new Font("Arial", 20), Brushes.Black, 8, 4); }
        using var ms = new MemoryStream(); bmp.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
        using var engine = new TesseractEngine(tess, "eng", EngineMode.LstmOnly); using var pix = Pix.LoadFromMemory(ms.ToArray()); using var page = engine.Process(pix);
        var b = Parser.Parse(page.GetText(), sets);
        var ok2 = b.SetKey == "GladiatorsFinale" && b.MainStatKey == "enerRech_" && b.Level == 20 && b.Substats.Count >= 3;
        Console.WriteLine(ok2 ? "ocr OK" : "ocr FALHOU: " + page.GetText().Replace("\n", " | "));
        // 3 motores lendo a mesma imagem ao mesmo tempo precisam dar o mesmo texto (o scanner le em paralelo).
        var png = ms.ToArray(); var single = page.GetText();
        var par = Enumerable.Range(0, 3).Select(_ => Task.Run(() => { using var e = new TesseractEngine(tess, "eng", EngineMode.LstmOnly); using var px = Pix.LoadFromMemory(png); using var pg = e.Process(px); return pg.GetText(); })).Select(t => t.Result).ToList();
        var ok3 = par.All(t => t == single);
        Console.WriteLine(ok3 ? "ocr paralelo OK" : "ocr paralelo FALHOU");
        return ok && ok2 && ok3 ? 0 : 1;
    }
}
