using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

static class Native
{
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindowW(string? cls, string? title);
    [DllImport("user32.dll")] static extern bool GetClientRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern bool ClientToScreen(IntPtr h, ref POINT p);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] static extern void mouse_event(uint f, int dx, int dy, int data, UIntPtr extra);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vk);
    [DllImport("shell32.dll")] static extern bool IsUserAnAdmin();

    public static bool IsAdmin => IsUserAnAdmin();
    public static IntPtr FindGame()
    {
        foreach (var t in new[] { "Genshin Impact", "原神" }) { var h = FindWindowW("UnityWndClass", t); if (h != IntPtr.Zero) return h; }
        return IntPtr.Zero;
    }
    public static bool Minimized(IntPtr h) => IsIconic(h);
    public static bool InFront(IntPtr h) => GetForegroundWindow() == h;
    public static void Focus(IntPtr h) => SetForegroundWindow(h);
    public static (int w, int h) ClientSize(IntPtr h) { GetClientRect(h, out var r); return (r.R, r.B); }
    public static bool EscPressed => (GetAsyncKeyState(0x1B) & 0x8000) != 0;

    /// Clica na posicao (px) dentro da area do jogo.
    public static void Click(IntPtr h, int x, int y)
    {
        var p = new POINT { X = x, Y = y }; ClientToScreen(h, ref p);
        SetCursorPos(p.X, p.Y); Thread.Sleep(15);
        mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero); Thread.Sleep(15); mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
    }

    public static void Scroll(IntPtr h, int x, int y, int notches)
    {
        var p = new POINT { X = x, Y = y }; ClientToScreen(h, ref p); SetCursorPos(p.X, p.Y);
        for (int i = 0; i < Math.Abs(notches); i++) { mouse_event(0x0800, 0, 0, notches > 0 ? -120 : 120, UIntPtr.Zero); Thread.Sleep(25); } // notches > 0 = para baixo
    }

    /// Arrasta com o botao esquerdo de (x, y1) ate (x, y2): puxa a lista (y2 < y1 = para cima).
    public static void Drag(IntPtr h, int x, int y1, int y2)
    {
        var p = new POINT { X = x, Y = y1 }; ClientToScreen(h, ref p); SetCursorPos(p.X, p.Y); Thread.Sleep(40);
        mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero); Thread.Sleep(40);
        const int steps = 14; for (int i = 1; i <= steps; i++) { SetCursorPos(p.X, p.Y + (y2 - y1) * i / steps); Thread.Sleep(18); }
        Thread.Sleep(80); mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
    }

    /// Imagem atual da area util da janela do jogo (o jogo precisa estar na frente).
    public static Bitmap Capture(IntPtr h)
    {
        var (w, ht) = ClientSize(h);
        var bmp = new Bitmap(w, ht, PixelFormat.Format24bppRgb);
        using var g = Graphics.FromImage(bmp);
        var p = new POINT(); ClientToScreen(h, ref p);
        g.CopyFromScreen(p.X, p.Y, 0, 0, new Size(w, ht));
        return bmp;
    }
}
