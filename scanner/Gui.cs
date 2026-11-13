using System.Drawing;
using System.Windows.Forms;

// Janela do scanner: escolhe os filtros e mostra o progresso e os erros (no lugar do console).
class Gui : Form
{
    readonly NumericUpDown level = new() { Minimum = 0, Maximum = 20, Value = 16, Width = 60 };
    readonly ComboBox rarity = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 110 };
    readonly CheckBox sorted = new() { Text = "Lista ordenada por nível (decrescente): para ao chegar abaixo do mínimo", AutoSize = true };
    readonly Button start = new() { Text = "Iniciar", Width = 110, Height = 32 }, stop = new() { Text = "Parar", Width = 110, Height = 32, Enabled = false };
    readonly TextBox log = new() { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, Dock = DockStyle.Fill, Font = new Font("Consolas", 9) };

    public Gui()
    {
        Text = "Astralys Scanner 0.1.0 (beta)"; ClientSize = new Size(560, 420); StartPosition = FormStartPosition.CenterScreen;
        rarity.Items.AddRange(new object[] { "Todas", "3★ ou mais", "4★ ou mais", "5★" }); rarity.SelectedIndex = 0;
        var top = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, Padding = new Padding(8), WrapContents = true };
        top.Controls.Add(new Label { Text = "Abra o Genshin em janela (1600x900), na lista de artefatos do inventário, e clique em Iniciar. Não mexa no mouse até terminar. Para PARAR a qualquer momento, aperte a tecla ESC (ou clique em Parar).", Width = 540, Height = 48, Font = new Font(Font, FontStyle.Bold) });
        top.Controls.Add(new Label { Text = "Nível mínimo:", AutoSize = true, Margin = new Padding(3, 8, 0, 0) }); top.Controls.Add(level);
        top.Controls.Add(new Label { Text = "Raridade:", AutoSize = true, Margin = new Padding(12, 8, 0, 0) }); top.Controls.Add(rarity);
        top.Controls.Add(sorted); top.SetFlowBreak(rarity, true);
        top.Controls.Add(start); top.Controls.Add(stop);
        Controls.Add(log); Controls.Add(top);
        start.Click += (_, _) => Run(); stop.Click += (_, _) => { Program.Cancel = true; stop.Enabled = false; };
        FormClosing += (_, _) => Program.Cancel = true;
    }

    void Add(string s) { if (IsDisposed) return; BeginInvoke(() => log.AppendText(s.Replace("\n", "\r\n") + "\r\n")); }

    void Run()
    {
        var args = new List<string> { "--min-level", ((int)level.Value).ToString(), "--min-rarity", (rarity.SelectedIndex == 0 ? 1 : rarity.SelectedIndex + 2).ToString() };
        if (sorted.Checked) args.Add("--sorted-by-level");
        args.Add("--keep"); // a janela não apaga o exe; ele some só se o usuário apagar
        args.Add("--out"); args.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "astralys-artefatos.json"));
        Program.Cancel = false; Program.Sink = Add; log.Clear(); start.Enabled = false; stop.Enabled = true;
        Task.Run(() =>
        {
            try { Program.Scan(args.ToArray(), Program.Sets()); }
            catch (Exception e) { Add("ERRO inesperado: " + (e.InnerException ?? e)); }
            if (!IsDisposed) BeginInvoke(() => { start.Enabled = true; stop.Enabled = false; });
        });
    }
}
