import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Clock } from "lucide-react";
import { sidebarBlogs, BlogPost } from "../../data/blogData";
import SidebarBlogItem from "../../components/blog_integrated/SidebarBlogItem";
import Header from "../../components/blog_integrated/Header";
import { useRef } from "react";

const BlogDetailContent = ({ blog, prevBlog, nextBlog, otherBlogs }: {
  blog: BlogPost;
  prevBlog: BlogPost | null;
  nextBlog: BlogPost | null;
  otherBlogs: BlogPost[];
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Fade Effect */}
      <div ref={heroRef} className="relative h-[70vh] overflow-hidden mt-[4.5rem] md:mt-20">
        <motion.div
          className="absolute inset-0"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background z-10" />
          <img
            src={blog.heroImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Hero Content */}
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="container mx-auto px-4 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full border border-primary/30">
                  {blog.authorRole}
                </span>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span>8 min read</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                {blog.title}
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mb-6">
                Discover how TrackMyAcademy revolutionizes sports performance tracking for athletes, coaches, and academies worldwide.
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center border border-primary/50">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{blog.author}</p>
                  <p className="text-sm text-muted-foreground">{blog.authorRole} Team</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Article Content */}
          <article className="lg:col-span-2 space-y-12">

            {/* Blog Content */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                {blog.content.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    className="text-lg text-muted-foreground leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </motion.section>

            {/* Key Highlights */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="p-8 bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl border border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-6">Key Takeaways</h3>
                <ul className="space-y-4">
                  {blog.highlights.map((highlight, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-foreground">{highlight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.section>

            {/* Article Navigation */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="pt-8 border-t border-border/50 space-y-6"
            >
              {/* Back to All Blogs */}
              <Link
                to="/blog-new"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to All Blogs</span>
              </Link>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prevBlog && (
                  <Link
                    to={`/blog-new/${prevBlog.slug}`}
                    className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span>Previous Article</span>
                    </div>
                    <p className="text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {prevBlog.title}
                    </p>
                  </Link>
                )}

                {nextBlog && (
                  <Link
                    to={`/blog-new/${nextBlog.slug}`}
                    className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all md:ml-auto md:text-right shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2 md:justify-end">
                      <span>Next Article</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {nextBlog.title}
                    </p>
                  </Link>
                )}
              </div>
            </motion.section>
          </article>

          {/* Sidebar */}
          <motion.aside
            className="space-y-8 lg:sticky lg:top-24 lg:self-start"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                Related Articles
              </h3>
              <div className="space-y-4">
                {otherBlogs.map((item, index) => (
                  <motion.div
                    key={item.slug}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <SidebarBlogItem
                      slug={item.slug}
                      title={item.title}
                      thumbnail={item.thumbnail}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.aside>
        </div>
      </div>
    </div>
  );
};

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const blog = sidebarBlogs.find(b => b.slug === slug);
  const currentIndex = sidebarBlogs.findIndex(b => b.slug === slug);
  const prevBlog = currentIndex > 0 ? sidebarBlogs[currentIndex - 1] : null;
  const nextBlog = currentIndex < sidebarBlogs.length - 1 ? sidebarBlogs[currentIndex + 1] : null;
  const otherBlogs = sidebarBlogs.filter(b => b.slug !== slug).slice(0, 3);

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Blog not found</h1>
          <Link to="/blog-new" className="text-primary hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return <BlogDetailContent blog={blog} prevBlog={prevBlog} nextBlog={nextBlog} otherBlogs={otherBlogs} />;
};

export default BlogDetail;
