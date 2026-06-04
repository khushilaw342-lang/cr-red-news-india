import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
  { key: "facebook",  label: "Facebook",  color: "bg-blue-600 hover:bg-blue-700",  connectUrl: "/api/auth/facebook"  },
  { key: "instagram", label: "Instagram", color: "bg-pink-600 hover:bg-pink-700",  connectUrl: "/api/auth/instagram" },
  { key: "telegram",  label: "Telegram",  color: "bg-sky-500  hover:bg-sky-600",   connectUrl: null                  },
  { key: "youtube",   label: "YouTube",   color: "bg-red-600  hover:bg-red-700",   connectUrl: null                  },
] as const;

type PlatformKey = typeof PLATFORMS[number]["key"];

const LS_KEY = "cr_selected_platforms";

function loadSelected(): Record<PlatformKey, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return saved;
  } catch {
    return {} as Record<PlatformKey, boolean>;
  }
}

export default function SocialPublish() {
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<Record<PlatformKey, boolean>>(loadSelected);
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState(false);

  // Fetch which platforms are connected (session-based)
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  const togglePlatform = (key: PlatformKey) => {
    setSelected((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleConnect = (url: string | null) => {
    if (!url) {
      toast({ title: "इस platform के लिए Admin Panel में API Key सेट करें", variant: "destructive" });
      return;
    }
    window.open(url, "_blank", "width=600,height=500");
    // Recheck status after a delay
    setTimeout(() => {
      fetch("/api/auth/status").then((r) => r.json()).then(setStatus).catch(() => {});
    }, 3000);
  };

  const handlePublish = async () => {
    const activePlatforms = PLATFORMS.filter((p) => selected[p.key]);
    if (activePlatforms.length === 0) {
      toast({ title: "कम से कम एक platform select करें", variant: "destructive" });
      return;
    }
    if (!caption.trim()) {
      toast({ title: "Caption / खबर का विवरण लिखें", variant: "destructive" });
      return;
    }

    setPublishing(true);
    try {
      const platformMap: Record<string, boolean> = {};
      activePlatforms.forEach((p) => { platformMap[p.key] = true; });

      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, mediaUrl, platforms: platformMap }),
      });
      const data = await res.json() as { success: boolean; message: string; errors?: Record<string, string> };

      if (data.success) {
        toast({ title: data.message });
        setCaption("");
        setMediaUrl("");
      } else {
        toast({ title: data.message || "Publish failed", variant: "destructive" });
      }

      if (data.errors) {
        Object.entries(data.errors).forEach(([plat, err]) => {
          toast({ title: `${plat}: ${err}`, variant: "destructive" });
        });
      }
    } catch {
      toast({ title: "Network error — try again", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-black mb-2">Social Media Publish</h1>
        <p className="text-muted-foreground mb-8">एक बार में सभी platforms पर खबर publish करें</p>

        {/* Platform Selection */}
        <Card className="mb-6 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Platforms चुनें</CardTitle>
            <CardDescription>जिस platform पर publish करना है उसे select करें</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {PLATFORMS.map((p) => {
              const isConnected = status[p.key];
              const isSelected = selected[p.key];
              return (
                <div
                  key={p.key}
                  className={`rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => togglePlatform(p.key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{p.label}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isConnected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {isConnected ? "Connected" : "Not Connected"}
                    </span>
                  </div>
                  {p.connectUrl && !isConnected && (
                    <Button
                      size="sm"
                      className={`mt-2 w-full text-white text-xs ${p.color}`}
                      onClick={(e) => { e.stopPropagation(); handleConnect(p.connectUrl); }}
                    >
                      Connect {p.label}
                    </Button>
                  )}
                  {!p.connectUrl && !isConnected && (
                    <p className="text-xs text-muted-foreground mt-1">Admin Panel में API Key set करें</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Post Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>खबर / Post Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Caption / विवरण *</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="यहाँ खबर का विवरण लिखें जो social media पर publish होगा..."
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Media URL (Image / Video — optional)</Label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Publish Button */}
        <Button
          className="w-full h-14 text-lg font-black"
          onClick={handlePublish}
          disabled={publishing}
        >
          {publishing ? "Publishing..." : "Publish Now — सभी Platforms पर भेजें"}
        </Button>

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Note:</strong> Facebook और Instagram को पहले Connect करना होगा (OAuth)।
          Telegram के लिए Admin Panel में <code>TELEGRAM_BOT_TOKEN</code> और <code>TELEGRAM_CHAT_ID</code> set करें।
        </div>
      </div>
    </Layout>
  );
}
