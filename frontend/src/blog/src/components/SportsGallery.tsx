import { motion } from "framer-motion";

interface SportsGalleryProps {
  images: {
    src: string;
    alt: string;
    caption: string;
  }[];
}

const SportsGallery = ({ images }: SportsGalleryProps) => {
  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Sports We Track
        </h2>
        <p className="text-muted-foreground">
          TrackMyAcademy supports athletes across multiple disciplines
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group relative rounded-2xl overflow-hidden aspect-square bg-card border border-border cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-sm font-medium text-white">
                {image.caption}
              </span>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 rounded-2xl transition-colors" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SportsGallery;
