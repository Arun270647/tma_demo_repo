import { motion } from "framer-motion";

interface FeaturedBlogCardProps {
  title: string;
  author: string;
  description: string;
  image: string;
  scrollProgress: number;
}

const FeaturedBlogCard = ({ title, author, description, image, scrollProgress }: FeaturedBlogCardProps) => {
  const imageOpacity = Math.max(0.3, 1 - scrollProgress * 1.5);
  const imageScale = Math.max(0.9, 1 - scrollProgress * 0.1);

  return (
    <div className="space-y-6">
      {/* Featured Image */}
      <motion.div 
        className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-lg"
        style={{
          opacity: imageOpacity,
          scale: imageScale,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="aspect-[4/3] relative">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
        </div>
      </motion.div>

      {/* Blog Content */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
          {title}
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-sm font-semibold">T</span>
          </div>
          <span className="text-muted-foreground text-sm">{author}</span>
        </div>

        <p className="text-muted-foreground leading-relaxed max-w-xl">
          {description}
        </p>
      </motion.div>
    </div>
  );
};

export default FeaturedBlogCard;
