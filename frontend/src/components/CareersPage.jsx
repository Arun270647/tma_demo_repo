import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Heart, Award, Briefcase, MapPin, Clock } from 'lucide-react';
import Header from './landing/Header';
import Footer from './landing/Footer';

const CareersPage = () => {
  // Job listings data
  const openPositions = [
    {
      id: 1,
      title: 'Full Stack Developer',
      department: 'Engineering',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      description: 'Join our engineering team to build innovative features for sports academies worldwide.',
      requirements: [
        '3+ years of experience with React and Node.js',
        'Strong understanding of modern web technologies',
        'Experience with database design and optimization',
        'Excellent problem-solving skills'
      ]
    },
    {
      id: 2,
      title: 'UI/UX Designer',
      department: 'Design',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      description: 'Create beautiful and intuitive interfaces that coaches and athletes love to use.',
      requirements: [
        '2+ years of UI/UX design experience',
        'Proficiency in Figma or similar design tools',
        'Strong portfolio showcasing web/mobile projects',
        'Understanding of user-centered design principles'
      ]
    },
    {
      id: 3,
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      description: 'Drive product strategy and work with cross-functional teams to deliver value to our users.',
      requirements: [
        '3+ years of product management experience',
        'Strong analytical and communication skills',
        'Experience with agile methodologies',
        'Passion for sports and technology'
      ]
    }
  ];

  const cultureValues = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Family First',
      description: 'We\'re not just colleagues – we\'re family. Every team member is valued, heard, and celebrated.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Work-Life Balance',
      description: 'We believe in doing more than just work. Team trips, celebrations, and fun activities are part of our DNA.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Recognition & Growth',
      description: 'Your contributions matter. We give credit where it\'s due and invest in your professional development.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-left">
              Join Our <span className="text-blue-600">Team</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 text-left">
              Be part of a team that's revolutionizing sports academy management.
              We're building something special, and we'd love to have you with us.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Life at Track My Academy Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-left">
              Life at Track My Academy
            </h2>
            <p className="text-xl text-gray-600 text-left max-w-3xl">
              We're more than a team – we're a family. Our culture is built on collaboration,
              celebration, and mutual respect.
            </p>
          </motion.div>

          {/* Culture Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {cultureValues.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-blue-50 rounded-2xl p-8 text-left"
              >
                <div className="text-blue-600 mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Team Photos Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-left">
              Our Amazing Team
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Photo 1 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl overflow-hidden shadow-lg"
              >
                <img
                  src="/team-photos/team1.jpg"
                  alt="Team collaboration"
                  className="w-full h-80 object-cover"
                />
              </motion.div>

              {/* Photo 2 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl overflow-hidden shadow-lg"
              >
                <img
                  src="/team-photos/team2.jpg"
                  alt="Team celebration"
                  className="w-full h-80 object-cover"
                />
              </motion.div>

              {/* Photo 3 - Rotated properly */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl overflow-hidden shadow-lg"
              >
                <img
                  src="/team-photos/team3.jpg"
                  alt="Team outing"
                  className="w-full h-80 object-cover"
                  style={{ transform: 'rotate(0deg)' }}
                />
              </motion.div>

              {/* Photo 4 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl overflow-hidden shadow-lg"
              >
                <img
                  src="/team-photos/team4.jpg"
                  alt="Team working together"
                  className="w-full h-80 object-cover"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Culture Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-12 text-white"
          >
            <h3 className="text-3xl font-bold mb-6 text-left">
              Why Our Team Loves Working Here
            </h3>
            <div className="space-y-4 text-left">
              <p className="text-lg text-blue-50">
                <strong className="text-white">We're Family:</strong> Every team member is valued,
                respected, and celebrated for their unique contributions. We support each other through
                challenges and celebrate victories together.
              </p>
              <p className="text-lg text-blue-50">
                <strong className="text-white">Beyond Work:</strong> From team trips to game nights,
                we believe in building strong relationships outside of work. Our team outings and
                celebrations create memories that last a lifetime.
              </p>
              <p className="text-lg text-blue-50">
                <strong className="text-white">Recognition Matters:</strong> We give credit where
                it's due. Your work is acknowledged, your ideas are heard, and your growth is
                our priority. We invest in your success.
              </p>
              <p className="text-lg text-blue-50">
                <strong className="text-white">Collaborative Spirit:</strong> We tackle challenges
                together, share knowledge freely, and grow as a team. Your success is our success.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-left">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600 text-left">
              Find your next opportunity with us
            </p>
          </motion.div>

          <div className="space-y-6">
            {openPositions.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                  <div className="mb-4 md:mb-0 text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>

                <p className="text-gray-700 mb-4 text-left">{job.description}</p>

                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-3">Requirements:</h4>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-600">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Don't See the Right Position?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We're always looking for talented individuals. Send us your resume and
              we'll keep you in mind for future opportunities.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Send Your Resume
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
