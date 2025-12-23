import React from 'react';

const testimonials = [
  {
    quote: "Track My Academy has revolutionized how we manage our operations. The performance analytics are a game-changer for our coaching staff.",
    name: 'Anirudh Sharma',
    title: 'Director, Chennai Football Stars'
  },
  {
    quote: "The communication hub is fantastic. It's never been easier to keep parents and players updated. I can't imagine going back.",
    name: 'Priya Mehta',
    title: 'Head Coach, Future Champions Academy'
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-text-primary">Trusted by Leading Academies</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-secondary p-8 rounded-lg">
              <p className="text-text-secondary italic mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full mr-4">
                  {/* Placeholder for author image */}
                </div>
                <div>
                  <p className="font-bold text-text-primary">{testimonial.name}</p>
                  <p className="text-sm text-text-secondary">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
