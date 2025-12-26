import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface SidebarBlogItemProps {
  slug: string;
  title: string;
  thumbnail: string;
  delay?: number;
}

const SidebarBlogItem = ({ slug, title, thumbnail, delay = 0 }: SidebarBlogItemProps) => {
  return (
    <Link 
      to={`/blog/${slug}`}
      className="flex gap-4 p-4 rounded-xl bg-secondary/50 border border-border transition-all duration-300 cursor-pointer group hover:bg-secondary hover:border-primary/30 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h4>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
    </Link>
  );
};

export default SidebarBlogItem;
