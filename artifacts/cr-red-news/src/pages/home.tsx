import { useGetLatestNews, getGetLatestNewsQueryKey } from "@workspace/api-client-react";
import { NewsCard } from "@/components/news-card";
import { Layout } from "@/components/layout";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const { data: latestNews, isLoading } = useGetLatestNews({
    query: { queryKey: getGetLatestNewsQueryKey() }
  });

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">{title}</h2>
      <div className="flex-1 h-1 bg-gradient-to-r from-primary to-transparent" />
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-16">
        
        {/* Live TV Section */}
        <section>
          <SectionTitle title="Live TV" />
          {isLoading ? (
            <div className="w-full h-[400px] md:h-[500px] bg-muted animate-pulse rounded-lg" />
          ) : latestNews?.live && latestNews.live.length > 0 ? (
            <NewsCard item={latestNews.live[0]} featured />
          ) : (
            <div className="w-full h-[300px] bg-neutral-900 rounded-lg flex flex-col items-center justify-center text-neutral-500 border border-neutral-800">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium text-lg">No Live Broadcast Currently</p>
              <p className="text-sm opacity-70">Stay tuned for updates</p>
            </div>
          )}
        </section>

        {/* YouTube News */}
        {latestNews?.youtube && latestNews.youtube.length > 0 && (
          <section>
            <SectionTitle title="YouTube News" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestNews.youtube.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Video News */}
        {latestNews?.video && latestNews.video.length > 0 && (
          <section>
            <SectionTitle title="Video News" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestNews.video.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Photo News */}
        {latestNews?.photo && latestNews.photo.length > 0 && (
          <section>
            <SectionTitle title="Photo News" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestNews.photo.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

      </div>
    </Layout>
  );
}
