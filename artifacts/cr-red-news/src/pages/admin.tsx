import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { 
  useCreateNews, 
  useGetTicker, 
  getGetTickerQueryKey,
  useUpdateTicker,
  NewsInputType,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Tv, Youtube, Video, Image as ImageIcon, Type } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: ticker } = useGetTicker({
    query: { queryKey: getGetTickerQueryKey() }
  });
  
  const createNews = useCreateNews();
  const updateTicker = useUpdateTicker();

  const [tickerText, setTickerText] = useState("");
  
  useEffect(() => {
    if (ticker) {
      setTickerText(ticker.text);
    }
  }, [ticker]);

  const handleUpdateTicker = () => {
    updateTicker.mutate(
      { data: { text: tickerText } },
      {
        onSuccess: () => {
          toast({ title: "Ticker updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetTickerQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update ticker", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-black mb-8">Admin Dashboard</h1>

        <div className="grid gap-8">
          {/* Ticker Management */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                News Ticker
              </CardTitle>
              <CardDescription>Update the scrolling text at the bottom of the screen.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input 
                  value={tickerText} 
                  onChange={(e) => setTickerText(e.target.value)} 
                  placeholder="Enter breaking news text..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpdateTicker}
                  disabled={updateTicker.isPending}
                >
                  {updateTicker.isPending ? "Updating..." : "Update Ticker"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* News Publishing */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Content</CardTitle>
              <CardDescription>Select the content type you want to publish.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="live" className="flex items-center gap-2">
                    <Tv className="w-4 h-4" /> <span className="hidden sm:inline">Live TV</span>
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2">
                    <Youtube className="w-4 h-4" /> <span className="hidden sm:inline">YouTube</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="w-4 h-4" /> <span className="hidden sm:inline">Video</span>
                  </TabsTrigger>
                  <TabsTrigger value="photo" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Photo</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="live">
                  <NewsForm type="live" label="Live TV" urlLabel="YouTube Embed URL" urlPlaceholder="https://www.youtube.com/watch?v=..." />
                </TabsContent>
                <TabsContent value="youtube">
                  <NewsForm type="youtube" label="YouTube News" urlLabel="YouTube URL" urlPlaceholder="https://www.youtube.com/watch?v=..." />
                </TabsContent>
                <TabsContent value="video">
                  <NewsForm type="video" label="Video News" urlLabel="Video File URL" urlPlaceholder="https://example.com/video.mp4" />
                </TabsContent>
                <TabsContent value="photo">
                  <NewsForm type="photo" label="Photo News" urlLabel="Image URL" urlPlaceholder="https://example.com/image.jpg" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function NewsForm({ 
  type, 
  label, 
  urlLabel, 
  urlPlaceholder 
}: { 
  type: NewsInputType; 
  label: string; 
  urlLabel: string; 
  urlPlaceholder: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createNews = useCreateNews();
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [script, setScript] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const payload: any = { type, title, script };
    if (type === "live" || type === "youtube") {
      payload.embedUrl = url;
    } else {
      payload.mediaUrl = url;
    }

    createNews.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: `${label} published successfully!` });
          setTitle("");
          setUrl("");
          setScript("");
          queryClient.invalidateQueries();
        },
        onError: () => {
          toast({ title: "Failed to publish", variant: "destructive" });
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`title-${type}`}>Title / Headline *</Label>
        <Input 
          id={`title-${type}`} 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Enter a compelling headline..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`url-${type}`}>{urlLabel}</Label>
        <Input 
          id={`url-${type}`} 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder={urlPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`script-${type}`}>Script / Description</Label>
        <Textarea 
          id={`script-${type}`} 
          value={script} 
          onChange={(e) => setScript(e.target.value)} 
          placeholder="Enter the news story details here..."
          className="min-h-[150px]"
        />
      </div>

      <Button type="submit" className="w-full font-bold text-lg" disabled={createNews.isPending}>
        {createNews.isPending ? "Publishing..." : `Publish ${label}`}
      </Button>
    </form>
  );
}
