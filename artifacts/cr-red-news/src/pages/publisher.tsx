import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type User = { id: number; email: string; selectedPlatforms: Record<string, boolean> } | null;
type Status = Record<string, boolean> & { loggedIn: boolean };

const PLATFORMS = [
  { key: "facebook",  label: "Facebook",  color: "bg-blue-600 hover:bg-blue-700 text-white",  connectPath: "/api/connect/facebook"  },
  { key: "instagram", label: "Instagram", color: "bg-pink-600 hover:bg-pink-700 text-white",  connectPath: "/api/connect/instagram" },
  { key: "youtube",   label: "YouTube",   color: "bg-red-600  hover:bg-red-700  text-white",  connectPath: "/api/connect/youtube"   },
  { key: "telegram",  label: "Telegram",  color: "bg-sky-500  hover:bg-sky-600  text-white",  connectPath: null                     },
  { key: "twitter",   label: "Twitter/X", color: "bg-black    hover:bg-neutral-800 text-white", connectPath: null                   },
] as const;

export default function Publisher() {
  const { toast } = useToast();

  const [view, setView] = useState<"login" | "register" | "dashboard">("login");
  const [user, setUser] = useState<User>(null);
  const [status, setStatus] = useState<Status>({ loggedIn: false } as Status);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChat, setTelegramChat] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    const r = await fetch("/api/connect/status");
    const d = await r.json();
    setStatus(d);
    if (d.selectedPlatforms) setSelected(d.selectedPlatforms);
  };

  const fetchMe = async () => {
    const r = await fetch("/api/user/me");
    if (r.ok) {
      const u = await r.json();
      setUser(u);
      if (u.selectedPlatforms) setSelected(u.selectedPlatforms);
      setView("dashboard");
      fetchStatus();
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const handleAuth = async (type: "login" | "register") => {
    setLoading(true);
    try {
      const r = await fetch(`/api/user/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) { toast({ title: d.error, variant: "destructive" }); return; }
      toast({ title: d.message });
      await fetchMe();
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    setUser(null);
    setView("login");
    setStatus({ loggedIn: false } as Status);
  };

  const savePlatforms = async (next: Record<string, boolean>) => {
    setSelected(next);
    await fetch("/api/user/platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedPlatforms: next }),
    });
  };

  const handleConnect = (path: string | null, key: string) => {
    if (!path) {
      if (key === "telegram") {
        const t = prompt("Telegram Bot Token darj karein:");
        const c = prompt("Telegram Chat ID darj karein:");
        if (!t || !c) return;
        fetch("/api/connect/telegram", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botToken: t, chatId: c }),
        }).then(() => { toast({ title: "Telegram connected!" }); fetchStatus(); });
      } else {
        toast({ title: `${key} ke liye API keys developer portal se lein`, variant: "destructive" });
      }
      return;
    }
    window.open(path, "_blank", "width=600,height=500");
    setTimeout(fetchStatus, 3000);
  };

  const handlePublish = async () => {
    const active = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (!active.length) { toast({ title: "Koi platform select nahi hai", variant: "destructive" }); return; }
    if (!caption.trim()) { toast({ title: "Caption likhein", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const platformMap: Record<string, boolean> = {};
      active.forEach(k => { platformMap[k] = true; });
      const r = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, mediaUrl, platforms: platformMap }),
      });
      const d = await r.json();
      toast({ title: d.message });
      if (d.result?.length) d.result.forEach((msg: string) => toast({ title: msg }));
      setCaption(""); setMediaUrl("");
    } finally { setLoading(false); }
  };

  // ── LOGIN / REGISTER ──────────────────────────────
  if (view !== "dashboard") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 max-w-md">
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-2xl font-black">
                {view === "login" ? "Login karein" : "Account banayein"}
              </CardTitle>
              <CardDescription>
                {view === "login" ? "Apne account mein login karein" : "Naya account register karein"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aapka@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
              </div>
              <Button className="w-full font-bold" onClick={() => handleAuth(view)} disabled={loading}>
                {loading ? "Please wait..." : view === "login" ? "Login" : "Register"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {view === "login" ? "Naya account? " : "Pehle se account hai? "}
                <button className="text-primary font-semibold underline" onClick={() => setView(view === "login" ? "register" : "login")}>
                  {view === "login" ? "Register karein" : "Login karein"}
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── DASHBOARD ────────────────────────────────────
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Auto Publisher</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
        </div>

        {/* Platform Connect */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Accounts Connect karein</CardTitle>
            <CardDescription>Jis platform par publish karna hai usse connect karein</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLATFORMS.map(p => {
              const connected = status[p.key];
              const isSelected = selected[p.key] || false;
              return (
                <div key={p.key} className={`rounded-lg border-2 p-3 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`sel-${p.key}`}
                        checked={isSelected}
                        onChange={e => savePlatforms({ ...selected, [p.key]: e.target.checked })}
                        className="w-4 h-4 accent-red-700"
                      />
                      <label htmlFor={`sel-${p.key}`} className="font-bold text-sm cursor-pointer">{p.label}</label>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${connected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  {!connected && (
                    <Button size="sm" className={`w-full text-xs ${p.color}`}
                      onClick={() => handleConnect(p.connectPath as string | null, p.key)}>
                      Connect {p.label}
                    </Button>
                  )}
                  {connected && (
                    <Button size="sm" variant="outline" className="w-full text-xs text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => fetch("/api/connect/disconnect", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ platform: p.key }),
                      }).then(() => fetchStatus())}>
                      Disconnect
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Publish */}
        <Card>
          <CardHeader>
            <CardTitle>Publish karein</CardTitle>
            <CardDescription>Caption likhein aur selected platforms par bhejein</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Caption / Khabar *</Label>
              <Textarea value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Yahan khabar ka vivaran likhein..." className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label>Media URL (optional)</Label>
              <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg" />
            </div>
            <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground">
              <strong>Selected platforms:</strong>{" "}
              {Object.entries(selected).filter(([,v]) => v).map(([k]) => k).join(", ") || "Koi nahi chuna"}
            </div>
            <Button className="w-full h-12 text-base font-black" onClick={handlePublish} disabled={loading}>
              {loading ? "Publishing..." : "Submit — Publish karein"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
