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

    static void Log(string s) { Console.WriteLine(s); try { File.AppendAllText(LogPath, $"{DateTime.Now:HH:mm:ss} {s}\n"); } catch { } }
    static string Res(string name) { using var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name)!; using var r = new StreamReader(s); return r.ReadToEnd(); }
    static int Fail(string erro, string solucao) { Log($"\nERRO: {erro}\n  O que fazer: {solucao}"); Pause(); return 1; }
    static void Pause() { try { Console.WriteLine("\nPressione Enter para fechar."); Console.ReadLine(); } catch { } }
    static string? Arg(string[] a, string k) { var i = Array.IndexOf(a, k); return i >= 0 && i + 1 < a.Length ? a[i + 1] : null; }

    static int Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        var sets = JsonSerializer.Deserialize<List<SetName>>(Res("sets.json"), Json)!;
        if (args.Contains("--selftest")) return SelfTest(sets);

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
        using var engine = new TesseractEngine(tess, "eng", EngineMode.LstmOnly);

        Log($"Janela do jogo: {w}x{h}. Filtros: nível mínimo {minLevel}, raridade mínima {minRarity}. Para parar: tecla Esc.");
        Log("Não mexa no mouse nem no teclado até terminar.");
        Thread.Sleep(1500);

        var found = new List<Artifact>(); var uncertain = 0;
        int Px(double f, int total) => (int)Math.Round(f * total);
        byte[] DetailHash() { using var b = Native.Capture(game); return Hash(Crop(b, layout.Detail)); }
        string ReadDetail() { using var b = Native.Capture(game); return ReadPanel(b, engine, layout); }

        bool stop = false; int idle = 0; string? lastSig = null; int pageNo = 0;
        var firstRow = 0;
        while (!stop)
        {
            for (int r = firstRow; r < layout.Rows && !stop; r++)
                for (int c = 0; c < layout.Cols; c++)
                {
                    if (Native.EscPressed) { Log("Parado pela tecla Esc."); stop = true; break; }
                    if (!Native.InFront(game)) { Log("O jogo saiu da frente: parei. Volte ao início da lista e inicie de novo."); stop = true; break; }
                    var before = DetailHash();
                    Native.Click(game, Px(layout.GridX0 + c * layout.Dx, w), Px(layout.GridY0 + r * layout.Dy, h));
                    var changed = false;
                    for (int t = 0; t < 30 && !changed; t++) { Thread.Sleep(30); changed = !DetailHash().SequenceEqual(before); }
                    if (!changed) { if (++idle >= 3) { stop = true; break; } continue; }
                    idle = 0;
                    var a = Parser.Parse(ReadDetail(), sets);
                    var sig = $"{a.SetKey}|{a.SlotKey}|{a.MainStatKey}|{a.Level}|{string.Join(',', a.Substats.Select(x => x.Key + x.Value))}";
                    if (sig == lastSig) continue;
                    lastSig = sig;
                    if (sortedByLevel && a.Level is int lv && lv < minLevel) { Log("Chegou abaixo do nível mínimo: terminando."); stop = true; break; }
                    if ((a.Level ?? 99) < minLevel || a.Rarity < minRarity) continue;
                    if (a.Notes.Count > 0) uncertain++;
                    found.Add(a);
                    Log($"{found.Count}: {a.SetKey} {a.SlotKey} +{a.Level} {a.MainStatKey}{(a.Notes.Count > 0 ? "  (conferir: " + string.Join(' ', a.Notes) + ")" : "")}");
                }
            if (stop) break;
            // Fim da página: rola e mede quantas linhas a lista andou comparando faixas da imagem (não depende de saber quanto cada giro rola).
            // Andou 0 = fim da lista. Sem correspondência (andou demais) = volta e tenta com menos giros.
            Box Row(int r) => new(layout.GridX0 - layout.Dx / 2, layout.GridY0 + r * layout.Dy - layout.Dy / 2, layout.Dx * layout.Cols, layout.Dy);
            byte[][] Strips() { using var b = Native.Capture(game); return Enumerable.Range(0, layout.Rows).Select(r => Hash(Crop(b, Row(r)))).ToArray(); }
            var strips0 = Strips(); int notches = layout.ScrollNotches, shift = -1;
            int sx = Px(layout.GridX0 + layout.Dx * 3, w), sy = Px(layout.GridY0 + layout.Dy * 1.5, h);
            while (notches >= 1 && shift < 0)
            {
                Native.Scroll(game, sx, sy, notches); Thread.Sleep(450);
                var s1 = Strips();
                if (Enumerable.Range(0, layout.Rows).All(i => Close(s1[i], strips0[i]))) { shift = 0; break; }
                for (int k = 1; k < layout.Rows && shift < 0; k++)
                    if (Enumerable.Range(0, layout.Rows - k).All(i => Close(s1[i], strips0[i + k]))) shift = k;
                if (shift < 0) { Native.Scroll(game, sx, sy, -notches); Thread.Sleep(450); notches /= 2; }
            }
            if (shift == 0) break;
            if (shift < 0) { Log("Não consegui acompanhar a rolagem da lista: parei. Confira se a lista está visível e sem nada por cima."); break; }
            firstRow = layout.Rows - shift;
        }

        var outPath = Arg(args, "--out") ?? Path.Combine(Dir, "astralys-artefatos.json");
        var good = new { format = "GOOD", version = 2, source = "AstralysScanner " + Version, artifacts = found.Select(a => new { setKey = a.SetKey, slotKey = a.SlotKey, level = a.Level ?? 0, rarity = a.Rarity, mainStatKey = a.MainStatKey, location = "", lock_ = false, substats = a.Substats.Select(s => new { key = s.Key, value = s.Value }), astralysNotes = a.Notes.Count > 0 ? a.Notes : null }) };
        File.WriteAllText(outPath, JsonSerializer.Serialize(good, Json).Replace("\"lock_\"", "\"lock\""));
        Log($"\nPronto: {found.Count} artefatos ({uncertain} para conferir). Arquivo: {outPath}");
        Log("Importe esse arquivo na aba Inventário do Astralys.");
        if (!keep) SelfDelete();
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
        using var top = PrepareWhite(Crop(frame, l.Top), 190); using var lvl = PrepareWhite(Crop(frame, l.Level), 238); using var low = Prepare(Crop(frame, l.Low));
        return Ocr(engine, top, PageSegMode.Auto) + "\n" + Ocr(engine, lvl, PageSegMode.SingleLine) + "\n" + Ocr(engine, low, PageSegMode.Auto);
    }

    static bool Close(byte[] a, byte[] b) { long d = 0; for (int i = 0; i < a.Length; i++) d += Math.Abs(a[i] - b[i]); return d / a.Length < 8; }
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
        return ok && ok2 ? 0 : 1;
    }
}
