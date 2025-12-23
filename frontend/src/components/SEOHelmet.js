import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHelmet = ({ 
  title = "Track My Academy - Sports Academy Management Software | SaaS Platform India",
  description = "Revolutionary sports academy management software for Indian academies. Complete SaaS platform with player management, performance analytics, attendance tracking, and smart equipment integration. Free demo available.",
  keywords = "sports academy management software, sports management system India, academy management platform, player tracking software, sports analytics, attendance management, Chennai sports technology, IoT sports equipment",
  canonical,
  ogImage = "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png",
  ogType = "website",
  structuredData,
  noindex = false
}) => {
  const siteUrl = "https://login-fix-97.preview.emergentagent.com";
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="CP Infotech - Track My Academy" />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />
      <meta name="googlebot" content={noindex ? "noindex,nofollow" : "index,follow"} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Track My Academy" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@trackmyacademy" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      
      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="IN-TN" />
      <meta name="geo.placename" content="Chennai" />
      <meta name="geo.position" content="13.0827;80.2707" />
      <meta name="ICBM" content="13.0827, 80.2707" />
      
      {/* Business/SaaS Specific */}
      <meta name="business-type" content="SaaS Software" />
      <meta name="industry" content="Sports Technology" />
      <meta name="target-audience" content="Sports Academies, Coaches, Academy Owners" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link rel="preconnect" href="https://customer-assets.emergentagent.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//customer-assets.emergentagent.com" />
    </Helmet>
  );
};

export default SEOHelmet;
