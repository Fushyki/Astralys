using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

record SetName(string Name, int Rarity);
record Sub(string Key, double Value);
record Artifact(string? SetKey, string? SlotKey, int Rarity, int? Level, string? MainStatKey, List<Sub> Substats, List<string> Notes);

/// Texto do OCR (ingles) -> artefato. Porte de src/features/good/artifactOcr.ts (parseArtifactText), sem a tabela de valores do jogo.
static class Parser
{
    static string Plain(string s) => new string(s.Normalize(NormalizationForm.FormD).Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray()).ToLowerInvariant();
    static readonly string[] Elements = { "pyro", "hydro", "electro", "cryo", "anemo", "geo", "dendro" };
    static readonly string[] SubKeys = { "hp", "hp_", "atk", "atk_", "def", "def_", "eleMas", "enerRech_", "critRate_", "critDMG_" };

    public static string? StatKey(string label, bool percent)
    {
        var n = Plain(label);
        if (Regex.IsMatch(n, "crit.*rate")) return "critRate_";
        if (Regex.IsMatch(n, "crit.*dmg")) return "critDMG_";
        if (Regex.IsMatch(n, "recharge")) return "enerRech_";
        if (Regex.IsMatch(n, "mastery|\\bem\\b")) return "eleMas";
        if (Regex.IsMatch(n, "heal")) return "heal_";
        if (Regex.IsMatch(n, "physical")) return "physical_dmg_";
        var el = Elements.FirstOrDefault(e => n.Contains(e));
        if (el != null && Regex.IsMatch(n, "dmg|bonus")) return el + "_dmg_";
        if (Regex.IsMatch(n, "\\bhp\\b")) return percent ? "hp_" : "hp";
        if (Regex.IsMatch(n, "\\batk\\b|attack")) return percent ? "atk_" : "atk";
        if (Regex.IsMatch(n, "\\bdef\\b|defense")) return percent ? "def_" : "def";
        return null;
    }

    static readonly string[] Slots = { "flower", "plume", "sands", "goblet", "circlet" };
    static bool MainOk(string slot, string k) => slot switch
    {
        "flower" => k == "hp",
        "plume" => k == "atk",
        "sands" => k is "hp_" or "atk_" or "def_" or "eleMas" or "enerRech_",
        "goblet" => k is "hp_" or "atk_" or "def_" or "eleMas" || k.EndsWith("_dmg_"),
        _ => k is "hp_" or "atk_" or "def_" or "eleMas" or "critRate_" or "critDMG_" or "heal_",
    };
    static string? InferSlot(string? k) => k switch
    {
        null => null,
        "hp" => "flower",
        "atk" => "plume",
        "enerRech_" => "sands",
        "critRate_" or "critDMG_" or "heal_" => "circlet",
        _ when k.EndsWith("_dmg_") => "goblet",
        _ => null,
    };

    static double? ToNumber(string raw, bool percent)
    {
        raw = Regex.Replace(raw.Trim('.', ','), @"[.,]{2,}", "."); // OCR as vezes duplica o ponto ("14..8")
        if (!percent && Regex.IsMatch(raw, @"^\d{1,3}([.,]\d{3})+$")) return double.Parse(Regex.Replace(raw, "[.,]", ""), CultureInfo.InvariantCulture);
        if (!double.TryParse(raw.Replace(',', '.'), NumberStyles.Float, CultureInfo.InvariantCulture, out var n)) return null;
        return percent ? n : Math.Round(n);
    }

    /// Palavras iguais a menos de uma letra trocada, sobrando ou faltando.
    static bool Edit1(string a, string b)
    {
        if (a == b) return true;
        if (a.Length == b.Length) return a.Zip(b).Count(t => t.First != t.Second) == 1;
        var (s, l) = a.Length < b.Length ? (a, b) : (b, a);
        int i = 0; while (i < s.Length && s[i] == l[i]) i++;
        return s[i..] == l[(i + 1)..];
    }

    static SetName? MatchSet(string text, IReadOnlyList<SetName> sets)
    {
        var words = Regex.Replace(Plain(text), "[^a-z0-9 ]", " ").Split(' ', StringSplitOptions.RemoveEmptyEntries).ToHashSet();
        SetName? best = null; double bestScore = 0; int bestLen = 0;
        foreach (var s in sets)
        {
            var parts = Regex.Replace(Plain(s.Name), "[^a-z0-9 ]", " ").Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(w => w.Length > 1).ToArray();
            if (parts.Length == 0) continue;
            var score = (double)parts.Count(p => words.Contains(p) || (p.Length >= 5 && words.Any(w => Math.Abs(w.Length - p.Length) <= 1 && Edit1(w, p)))) / parts.Length;
            if (score >= 0.75 && (best == null || score > bestScore || (score == bestScore && parts.Length > bestLen))) { best = s; bestScore = score; bestLen = parts.Length; }
        }
        return best;
    }

    public static string SetKeyOf(string name) => string.Concat(Regex.Replace(name, "[^A-Za-z0-9 ]", "").Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(w => char.ToUpper(w[0]) + w[1..]));

    public static Artifact Parse(string text, IReadOnlyList<SetName> sets)
    {
        var notes = new List<string>();
        var lines = Regex.Split(text, "\r?\n").Select(l => Regex.Replace(Regex.Replace(l, "[·•*●◆▪]", " "), @"\s+", " ").Trim()).Select(l => Regex.Replace(l, @"^(.*\d\s*%?)\s*[^\d%]*$", "$1")).Where(l => l.Length > 0).ToList(); // tira o lixo do OCR depois do ultimo numero ("ATK+37 =")
        var merged = new List<string>();
        for (int i = 0; i < lines.Count; i++)
        {
            var l = lines[i];
            if (!Regex.IsMatch(l, @"\d") && StatKey(l, false) != null && i + 1 < lines.Count && Regex.IsMatch(lines[i + 1], @"^\+?[\d.,]+\s*%?$") && !Regex.IsMatch(lines[i + 1], @"^\+\s*\d{1,2}$")) merged.Add(l + " " + lines[++i]);
            else merged.Add(l);
        }
        var cut = merged.FindIndex(l => Regex.IsMatch(Plain(l), @"\b[24]\s*-?\s*pieces?\b|\bset\b"));
        var body = cut >= 0 ? merged.Take(cut).ToList() : merged;

        var set = MatchSet(text, sets);
        if (set == null) notes.Add("Nao reconheci o set.");

        int? level = null; int? aboveLevel = null;
        var stats = new List<(string Key, double Value, bool Percent)>();
        foreach (var l in body)
        {
            var lv = Regex.Match(Regex.Replace(l, "[★☆✦*]", "").Trim(), @"^\+\s*(\d{1,2})\b[^A-Za-z0-9]*$");
            if (lv.Success && level == null && int.Parse(lv.Groups[1].Value) <= 20) { level = int.Parse(lv.Groups[1].Value); aboveLevel = stats.Count; continue; }
            var m = Regex.Match(l, @"^(.*?[A-Za-z%.']{2,}.*?)\s*[+:]?\s*(\d[\d.,]*)\s*(%)?\s*$");
            if (!m.Success) continue;
            var pct = m.Groups[3].Success;
            var key = StatKey(m.Groups[1].Value, pct);
            if (key != null && ToNumber(m.Groups[2].Value, pct) is double num) stats.Add((key, num, pct));
        }

        string? slot = null; var t = Plain(string.Join(' ', body));
        foreach (var k in Slots) if (Regex.IsMatch(t, k)) { slot = k; break; }

        int Score(int i) => (slot != null && MainOk(slot, stats[i].Key) ? 2 : 0) + (aboveLevel != null && i < aboveLevel ? 1 : 0);
        int mainIdx = -1;
        for (int i = 0; i < stats.Count; i++)
        {
            if (slot != null && !MainOk(slot, stats[i].Key)) continue;
            if (mainIdx < 0 || Score(i) > Score(mainIdx)) mainIdx = i;
        }
        var fixedMain = slot == "flower" ? "hp" : slot == "plume" ? "atk" : null;
        var mainKey = fixedMain ?? (mainIdx >= 0 ? stats[mainIdx].Key : null);
        var seen = new HashSet<string>(); var subs = new List<Sub>();
        for (int i = 0; i < stats.Count; i++)
        {
            var st = stats[i];
            if (i == mainIdx || st.Key == mainKey || !SubKeys.Contains(st.Key) || seen.Contains(st.Key) || subs.Count >= 4) continue;
            seen.Add(st.Key); subs.Add(new Sub(st.Key, st.Value));
        }
        if (mainKey == null) notes.Add("Nao achei o stat principal.");
        // 5★ ganha o 4o substatus em +4 (4★ em +16): menos que isso, algo ficou sem ler.
        var five = (set?.Rarity ?? 5) >= 5; var want = (level ?? 20) >= (five ? 4 : 16) ? 4 : five ? 3 : 2;
        if (subs.Count < want) notes.Add($"Li so {subs.Count} substat(s).");
        slot ??= InferSlot(mainKey);
        if (slot == null) notes.Add("Nao reconheci a posicao.");
        if (level == null) notes.Add("Nao li o nivel.");
        return new Artifact(set == null ? null : SetKeyOf(set.Name), slot, (set?.Rarity ?? 5) >= 5 ? 5 : 4, level, mainKey, subs, notes);
    }
}
