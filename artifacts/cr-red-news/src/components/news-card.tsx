import { Link } from "wouter";
import { NewsItem } from "@workspace/api-client-react";
import { Play, Youtube, Image as ImageIcon, Video } from "lucide-react";
import { getYouTubeEmbedUrl } from "../lib/youtube";

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  const isVideo = item.type === "video";
  const isYoutube = item.type === "youtube" || item.type === "live";
  const isPhoto = item.type === "photo";

  const getMediaPreview = () => {
    if (isYoutube && item.embedUrl) {
      const embed = getYouTubeEmbedUrl(item.embedUrl);
      if (embed && featured) {
        return (
          <iframe 
            src={embed} 
            className="w-full h-full object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        );
      }
      return (
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-red-600 relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
          <Youtube className="w-16 h-16 z-20" />
        </div>
      );
    }
    
    if (isVideo) {
      if (featured && item.mediaUrl) {
        return (
          <video 
            src={item.mediaUrl} 
            className="w-full h-full object-cover"
            controls
            muted
          />
        );
      }
      return (
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
          <Video className="w-12 h-12 z-20" />
        </div>
      );
    }

    if (isPhoto && item.mediaUrl) {
      return (
        <img 
          src={item.mediaUrl} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      );
    }

    return (
      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
        <ImageIcon className="w-10 h-10" />
      </div>
    );
  };

  const getIcon = () => {
    if (item.type === "live") return <TvIcon className="w-4 h-4" />;
    if (item.type === "youtube") return <Youtube className="w-4 h-4" />;
    if (item.type === "video") return <Video className="w-4 h-4" />;
    return <ImageIcon className="w-4 h-4" />;
  };

  const Component = featured && (isYoutube || isVideo) && item.embedUrl ? "div" : Link;
  const href = `/news/${item.id}`;
  
  const content = (
    <div className={`group flex flex-col overflow-hidden bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow ${featured ? 'h-[400px] md:h-[500px]' : 'h-full'}`}>
      <div className={`relative ${featured ? 'flex-1' : 'aspect-video'} bg-muted overflow-hidden`}>
        {item.type === "live" && (
          <div className="absolute top-4 left-4 z-30 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        {getMediaPreview()}
      </div>
      <div className={`${featured ? 'p-6 bg-black text-white' : 'p-4'} flex flex-col gap-2`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          {getIcon()}
          {item.type}
        </div>
        <h3 className={`font-bold leading-snug line-clamp-2 ${featured ? 'text-2xl md:text-3xl' : 'text-lg group-hover:text-primary transition-colors'}`}>
          {item.title}
        </h3>
        {item.script && (
          <p className={`text-muted-foreground line-clamp-2 mt-1 ${featured ? 'text-base md:text-lg' : 'text-sm'}`}>
            {item.script}
          </p>
        )}
      </div>
    </div>
  );

  if (Component === "div") {
    return <div>{content}</div>;
  }

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}

// Minimal placeholder
function TvIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  );
}
