import { useParams, Link } from "wouter";
import { useGetNewsItem, getGetNewsItemQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";

export default function Story() {
  const { id } = useParams();
  const newsId = id ? parseInt(id, 10) : 0;

  const { data: item, isLoading, isError } = useGetNewsItem(newsId, {
    query: {
      enabled: !!newsId,
      queryKey: getGetNewsItemQueryKey(newsId)
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
          <div className="h-8 bg-muted w-1/4 mb-8 rounded" />
          <div className="h-12 bg-muted w-3/4 mb-4 rounded" />
          <div className="h-6 bg-muted w-1/3 mb-8 rounded" />
          <div className="aspect-video bg-muted rounded-xl mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-muted w-full rounded" />
            <div className="h-4 bg-muted w-full rounded" />
            <div className="h-4 bg-muted w-5/6 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !item) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Story not found</h1>
          <Link href="/" className="text-primary hover:underline">Return to home</Link>
        </div>
      </Layout>
    );
  }

  const isYoutube = item.type === "youtube" || item.type === "live";
  
  return (
    <Layout>
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              {item.type}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">{item.title}</h1>
          <div className="flex items-center justify-between border-y border-border py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4" />
              {format(new Date(item.createdAt), "MMMM d, yyyy • h:mm a")}
            </div>
            <button className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </header>

        <div className="mb-10 rounded-xl overflow-hidden bg-black shadow-lg">
          {isYoutube && item.embedUrl ? (
            <div className="aspect-video">
              <iframe 
                src={getYouTubeEmbedUrl(item.embedUrl) || item.embedUrl} 
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          ) : item.type === "video" && item.mediaUrl ? (
            <video 
              src={item.mediaUrl} 
              className="w-full aspect-video object-cover"
              controls
              autoPlay
            />
          ) : item.type === "photo" && item.mediaUrl ? (
            <img 
              src={item.mediaUrl} 
              alt={item.title} 
              className="w-full h-auto max-h-[70vh] object-contain bg-neutral-900"
            />
          ) : null}
        </div>

        {item.script && (
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {item.script.split('\n').map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
            ))}
          </div>
        )}
      </article>
    </Layout>
  );
}
