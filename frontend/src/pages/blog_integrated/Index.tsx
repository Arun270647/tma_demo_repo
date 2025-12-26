import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FeaturedBlogCard from "@/components/blog_integrated/FeaturedBlogCard";
import SidebarBlogItem from "@/components/blog_integrated/SidebarBlogItem";

import SportsGallery from "@/components/blog_integrated/SportsGallery";
import Header from "@/components/blog_integrated/Header";
import { sidebarBlogs } from "@/data/blogData";
import footballHero from "../../assets/football-hero.png";
import sportsManagement from "../../assets/sports-management.png";
import basketballAction from "../../assets/basketball-action.png";
import athleteVictory from "../../assets/athlete-victory.png";
import teamWarmup from "../../assets/team-warmup.png";
import swimmingAthlete from "../../assets/swimming-athlete.png";
const sportsImages = [
  { src: sportsManagement, alt: "Sports academy management", caption: "Academy Management" },
  { src: basketballAction, alt: "Basketball practice", caption: "Basketball" },
  { src: athleteVictory, alt: "Track and field", caption: "Athletics" },
  { src: teamWarmup, alt: "Team warmup session", caption: "Multi-Sport" },
  { src: swimmingAthlete, alt: "Swimming athlete", caption: "Swimming" },
];

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 400;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-[4.5rem] md:h-20" />

      <div className="container mx-auto px-4 py-8 lg:py-16">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-gradient-blue pb-2">
              Learn
            </h1>
            <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
              Guided insights on how <span className="text-foreground font-medium">TrackMyAcademy</span> helps athletes, coaches, and sports academies track performance.
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Featured Blog - Left Side (2 cols) */}
          <div className="lg:col-span-2">
            <FeaturedBlogCard
              title="How TrackMyAcademy Works: A Smart Platform for Sports Performance Tracking"
              author="By TrackMyAcademy Team"
              description="TrackMyAcademy provides comprehensive player performance tracking with intuitive coach and academy dashboards. Monitor training sessions, analyze match performance, and make data-driven decisions to accelerate athlete development."
              image={footballHero}
              scrollProgress={scrollProgress}
            />
          </div>

          {/* Sidebar Blog List - Right Side */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              More Articles
            </h3>
            {sidebarBlogs.map((blog, index) => (
              <motion.div
                key={blog.slug}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                <SidebarBlogItem
                  slug={blog.slug}
                  title={blog.title}
                  thumbnail={blog.thumbnail}
                  delay={index * 100}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Sports Gallery Section */}
        <SportsGallery images={sportsImages} />
      </div>
    </div>
  );
};

export default Index;
