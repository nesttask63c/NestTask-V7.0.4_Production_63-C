import { X, Github, Linkedin, Mail, Globe, Twitter, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react';

interface DeveloperModalProps {
  onClose: () => void;
}

export function DeveloperModal({ onClose }: DeveloperModalProps) {
  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl bg-white rounded-2xl shadow-xl z-50 max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-6 flex justify-center">
            <img
              src="https://avatars.githubusercontent.com/u/113442689?s=400&u=ffb680dccfc0664b39c3990bef4a63c4639c2979&v=4"
              alt="Sheikh Shariar Nehal"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-20 pb-8">
          {/* Basic Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sheikh Shariar Nehal</h2>
            <p className="text-gray-600 mt-1">Full Stack Developer & UI/UX Designer</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Dhaka, Bangladesh</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { icon: Github, href: 'https://github.com/sheikhshariarnehal', label: 'GitHub' },
              { icon: Linkedin, href: 'https://www.linkedin.com/in/sheikhshariarnehal/', label: 'LinkedIn' },
              { icon: Twitter, href: 'https://twitter.com/SheikhNehal', label: 'Twitter' },
              { icon: Mail, href: 'mailto:sheikhshariarnehal@gmail.com', label: 'Email' },
              { icon: Globe, href: 'https://www.sheikhshariarnehal.com', label: 'Website' }
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          {/* About */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
            <p className="text-gray-600 leading-relaxed">
              I am a passionate Full Stack Developer and UI/UX Designer with expertise in creating 
              innovative digital solutions. With a strong foundation in both front-end and back-end 
              development, I specialize in building responsive web applications and creating 
              intuitive user experiences. Currently pursuing my BSc in Computer Science and 
              Engineering at Daffodil International University.
            </p>
          </div>

          {/* Experience */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience</h3>
            <div className="space-y-4">
              {[
                {
                  role: 'Full Stack Developer',
                  company: 'Freelance',
                  period: '2021 - Present',
                  description: 'Developing full-stack web applications using React, Node.js, and MongoDB. Creating responsive UI/UX designs and implementing modern web technologies.'
                },
                {
                  role: 'UI/UX Designer',
                  company: 'Various Projects',
                  period: '2020 - Present',
                  description: 'Designing user interfaces and experiences for web and mobile applications. Creating wireframes, prototypes, and high-fidelity designs.'
                }
              ].map((job, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{job.role}</h4>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500">{job.period}</p>
                    <p className="text-gray-600 mt-1">{job.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">BSc in Computer Science and Engineering</h4>
                <p className="text-gray-600">Daffodil International University</p>
                <p className="text-sm text-gray-500">2020 - Present</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
            <div className="space-y-3">
              {[
                'Meta Front-End Developer Professional Certificate',
                'Google UX Design Professional Certificate',
                'IBM Full Stack Software Developer Professional Certificate'
              ].map((cert, index) => (
                <div key={index} className="flex gap-3">
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-gray-600">{cert}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Node.js',
                'Express.js', 'MongoDB', 'PostgreSQL', 'Figma', 'Adobe XD',
                'TailwindCSS', 'Material-UI', 'Git', 'REST API', 'GraphQL',
                'Responsive Design', 'UI/UX Design', 'Web Accessibility'
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}