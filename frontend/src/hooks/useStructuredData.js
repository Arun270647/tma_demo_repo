import { useMemo } from 'react';

export const useOrganizationSchema = () => {
  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Track My Academy",
    "legalName": "CP Infotech",
    "url": "https://login-fix-97.preview.emergentagent.com",
    "logo": "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png",
    "image": "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png",
    "description": "Revolutionary sports academy management software for Indian academies. Complete SaaS platform with player management, performance analytics, and smart equipment integration.",
    "foundingDate": "2025",
    "founders": [
      {
        "@type": "Person",
        "name": "Founder Name",
        "jobTitle": "Founder & CEO"
      },
      {
        "@type": "Person", 
        "name": "Co-Founder Name",
        "jobTitle": "Co-Founder & CTO"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Incubation Centre, Vels University",
      "addressLocality": "Chennai",
      "addressRegion": "Tamil Nadu",
      "postalCode": "600117",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-98765-43210",
      "contactType": "customer service",
      "email": "admin@trackmyacademy.com",
      "availableLanguage": ["English", "Hindi", "Tamil"]
    },
    "sameAs": [
      "https://linkedin.com/company/trackmyacademy"
    ],
    "industry": "Sports Technology",
    "numberOfEmployees": "5-10",
    "areaServed": {
      "@type": "Country",
      "name": "India"
    }
  }), []);
};

export const useSoftwareApplicationSchema = () => {
  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Track My Academy",
    "applicationCategory": "Sports Management Software",
    "applicationSubCategory": "Academy Management System",
    "operatingSystem": "Web Browser",
    "description": "Comprehensive sports academy management SaaS platform with player tracking, performance analytics, attendance management, and smart equipment integration.",
    "image": "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": "24990",
      "highPrice": "124990",
      "description": "Annual subscription plans for sports academies"
    },
    "creator": {
      "@type": "Organization",
      "name": "CP Infotech",
      "logo": "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png"
    },
    "datePublished": "2025",
    "inLanguage": "en-IN",
    "targetAudience": {
      "@type": "Audience",
      "audienceType": "Sports Academies, Coaches, Academy Owners"
    },
    "featureList": [
      "Player Management System",
      "Performance Analytics Dashboard", 
      "Attendance Tracking",
      "Coach Management",
      "Communication Hub",
      "Smart Equipment Integration",
      "Multi-Academy Support",
      "Real-time Reports"
    ]
  }), []);
};

export const useWebsiteSchema = () => {
  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Track My Academy",
    "url": "https://login-fix-97.preview.emergentagent.com",
    "description": "Sports academy management software and smart equipment for Indian academies",
    "inLanguage": "en-IN",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://login-fix-97.preview.emergentagent.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CP Infotech",
      "logo": "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png"
    }
  }), []);
};

export const useBreadcrumbSchema = (items) => {
  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://login-fix-97.preview.emergentagent.com${item.url}`
    }))
  }), [items]);
};

export const useServiceSchema = () => {
  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Sports Academy Management Software",
    "description": "Complete SaaS solution for sports academy management including player tracking, performance analytics, and smart equipment integration.",
    "provider": {
      "@type": "Organization",
      "name": "Track My Academy",
      "logo": "https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "serviceType": "Sports Management Software",
    "audience": {
      "@type": "Audience",
      "audienceType": "Sports Academies"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Sports Academy Management Plans",
      "itemListElement": [
        {
          "@type": "Offer",
          "name": "Starter Plan",
          "price": "24990",
          "priceCurrency": "INR",
          "description": "Perfect for new and growing academies"
        },
        {
          "@type": "Offer", 
          "name": "Pro Plan",
          "price": "49990",
          "priceCurrency": "INR",
          "description": "Best for established academies"
        },
        {
          "@type": "Offer",
          "name": "Enterprise Plan", 
          "price": "124990",
          "priceCurrency": "INR",
          "description": "For large-scale organizations"
        }
      ]
    }
  }), []);
};
