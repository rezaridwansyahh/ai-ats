// Dummy applicant seed data tied to seeded job_sourcing entries (ids 1-7).
// `information` follows the Layer 1 facet schema produced by ai.service.extractFacets():
//   { job_position: { current, category }, skills: [], education: [{school,degree,year,tier}], experience: { years_total, positions: [] } }

export default [
  // --- Sourcing 1 (internal / Senior Frontend Engineer) ---
  {
    id: 1, job_sourcing_id: 1, name: 'Ayu Pratiwi', last_position: 'Frontend Engineer',
    address: 'Jakarta, Indonesia', education: "Bachelor's in Computer Science",
    information: {
      job_position: { current: 'Frontend Engineer', category: 'Frontend' },
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'JavaScript'],
      education: [
        { school: 'Universitas Indonesia', degree: "Bachelor's in Computer Science", year: 2021, tier: 'top' },
      ],
      experience: {
        years_total: 4,
        positions: [
          { title: 'Frontend Engineer', company: 'Tokopedia', years: 2 },
          { title: 'Junior Frontend Engineer', company: 'Bukalapak', years: 2 },
        ],
      },
    },
    date: '2026-04-05 10:12:00', attachment: null,
  },
  {
    id: 2, job_sourcing_id: 1, name: 'Budi Santoso', last_position: 'UI Engineer',
    address: 'Bandung, Indonesia', education: "Bachelor's in Informatics",
    information: {
      job_position: { current: 'UI Engineer', category: 'Frontend' },
      skills: ['Vue.js', 'React', 'CSS', 'HTML', 'JavaScript'],
      education: [
        { school: 'Institut Teknologi Bandung', degree: "Bachelor's in Informatics", year: 2022, tier: 'top' },
      ],
      experience: {
        years_total: 3,
        positions: [
          { title: 'UI Engineer', company: 'Traveloka', years: 2 },
          { title: 'Frontend Intern', company: 'Gojek', years: 1 },
        ],
      },
    },
    date: '2026-04-06 09:30:00', attachment: null,
  },

  // --- Sourcing 2 (internal / Product Designer) ---
  {
    id: 3, job_sourcing_id: 2, name: 'Citra Lestari', last_position: 'Senior Product Designer',
    address: 'Singapore', education: "Bachelor's in Design",
    information: {
      job_position: { current: 'Senior Product Designer', category: 'Product Design' },
      skills: ['Figma', 'Sketch', 'Adobe XD', 'Design Systems'],
      education: [
        { school: 'National University of Singapore', degree: "Bachelor's in Design", year: 2019, tier: 'top' },
      ],
      experience: {
        years_total: 6,
        positions: [
          { title: 'Senior Product Designer', company: 'Grab', years: 3 },
          { title: 'Product Designer', company: 'Shopee', years: 3 },
        ],
      },
    },
    date: '2026-04-07 14:20:00', attachment: null,
  },

  // --- Sourcing 3 (seek / Senior Frontend Engineer) ---
  {
    id: 4, job_sourcing_id: 3, name: 'Dewi Anggraini', last_position: 'Frontend Developer',
    address: 'Jakarta, Indonesia', education: "Bachelor's in Computer Science",
    information: {
      job_position: { current: 'Frontend Developer', category: 'Frontend' },
      skills: ['React', 'Next.js', 'GraphQL', 'TypeScript', 'Tailwind CSS'],
      education: [
        { school: 'Universitas Gadjah Mada', degree: "Bachelor's in Computer Science", year: 2020, tier: 'top' },
      ],
      experience: {
        years_total: 5,
        positions: [
          { title: 'Frontend Developer', company: 'Tiket.com', years: 3 },
          { title: 'Junior Frontend Developer', company: 'Blibli', years: 2 },
        ],
      },
    },
    date: '2026-04-08 11:05:00', attachment: null,
  },
  {
    id: 5, job_sourcing_id: 3, name: 'Eko Nugroho', last_position: 'React Engineer',
    address: 'Surabaya, Indonesia', education: 'Diploma in Software Engineering',
    information: {
      job_position: { current: 'React Engineer', category: 'Frontend' },
      skills: ['React', 'Redux', 'JavaScript', 'CSS'],
      education: [
        { school: 'Politeknik Elektronika Negeri Surabaya', degree: 'Diploma in Software Engineering', year: 2023, tier: 'mid' },
      ],
      experience: {
        years_total: 2,
        positions: [
          { title: 'React Engineer', company: 'OVO', years: 2 },
        ],
      },
    },
    date: '2026-04-09 08:45:00', attachment: null,
  },
  {
    id: 6, job_sourcing_id: 3, name: 'Fitri Handayani', last_position: 'Software Engineer',
    address: 'Yogyakarta, Indonesia', education: "Bachelor's in Computer Engineering",
    information: {
      job_position: { current: 'Software Engineer', category: 'Full Stack' },
      skills: ['React', 'Node.js', 'AWS', 'TypeScript', 'PostgreSQL'],
      education: [
        { school: 'Universitas Gadjah Mada', degree: "Bachelor's in Computer Engineering", year: 2018, tier: 'top' },
      ],
      experience: {
        years_total: 7,
        positions: [
          { title: 'Software Engineer', company: 'Xendit', years: 4 },
          { title: 'Frontend Engineer', company: 'Tokopedia', years: 3 },
        ],
      },
    },
    date: '2026-04-09 16:00:00', attachment: null,
  },

  // --- Sourcing 4 (seek / Backend Engineer Node.js) ---
  {
    id: 7, job_sourcing_id: 4, name: 'Gilang Ramadhan', last_position: 'Backend Engineer',
    address: 'Bali, Indonesia', education: "Bachelor's in Computer Science",
    information: {
      job_position: { current: 'Backend Engineer', category: 'Backend' },
      skills: ['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'REST'],
      education: [
        { school: 'Universitas Udayana', degree: "Bachelor's in Computer Science", year: 2021, tier: 'mid' },
      ],
      experience: {
        years_total: 4,
        positions: [
          { title: 'Backend Engineer', company: 'Halodoc', years: 2 },
          { title: 'Junior Backend Developer', company: 'Mekari', years: 2 },
        ],
      },
    },
    date: '2026-04-10 09:20:00', attachment: null,
  },
  {
    id: 8, job_sourcing_id: 4, name: 'Hana Putri', last_position: 'Full-Stack Engineer',
    address: 'Denpasar, Indonesia', education: "Bachelor's in Information Systems",
    information: {
      job_position: { current: 'Full-Stack Engineer', category: 'Full Stack' },
      skills: ['Node.js', 'React', 'MongoDB', 'Express', 'JavaScript'],
      education: [
        { school: 'Binus University', degree: "Bachelor's in Information Systems", year: 2022, tier: 'mid' },
      ],
      experience: {
        years_total: 3,
        positions: [
          { title: 'Full-Stack Engineer', company: 'Kredivo', years: 2 },
          { title: 'Backend Intern', company: 'DANA', years: 1 },
        ],
      },
    },
    date: '2026-04-11 10:10:00', attachment: null,
  },

  // --- Sourcing 5 (seek / Talent Acquisition Specialist) — Draft, no applicants yet ---

  // --- Sourcing 6 (linkedin / Senior Frontend Engineer) ---
  {
    id: 9, job_sourcing_id: 6, name: 'Irfan Maulana', last_position: 'Frontend Lead',
    address: 'Jakarta, Indonesia', education: "Master's in Software Engineering",
    information: {
      job_position: { current: 'Frontend Lead', category: 'Frontend' },
      skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS', 'Architecture'],
      education: [
        { school: 'Institut Teknologi Bandung', degree: "Master's in Software Engineering", year: 2017, tier: 'top' },
        { school: 'Institut Teknologi Bandung', degree: "Bachelor's in Computer Science", year: 2014, tier: 'top' },
      ],
      experience: {
        years_total: 8,
        positions: [
          { title: 'Frontend Lead', company: 'GoTo', years: 3 },
          { title: 'Senior Frontend Engineer', company: 'Tokopedia', years: 3 },
          { title: 'Frontend Engineer', company: 'Bukalapak', years: 2 },
        ],
      },
    },
    date: '2026-04-09 13:40:00', attachment: null,
  },
  {
    id: 10, job_sourcing_id: 6, name: 'Julia Saputra', last_position: 'Frontend Engineer',
    address: 'Kuala Lumpur, Malaysia', education: "Bachelor's in Computer Science",
    information: {
      job_position: { current: 'Frontend Engineer', category: 'Frontend' },
      skills: ['React', 'Tailwind CSS', 'Jest', 'TypeScript', 'JavaScript'],
      education: [
        { school: 'Universiti Malaya', degree: "Bachelor's in Computer Science", year: 2021, tier: 'top' },
      ],
      experience: {
        years_total: 4,
        positions: [
          { title: 'Frontend Engineer', company: 'AirAsia', years: 2 },
          { title: 'Junior Frontend Developer', company: 'iPrice', years: 2 },
        ],
      },
    },
    date: '2026-04-10 15:25:00', attachment: null,
  },

  // --- Sourcing 7 (linkedin / Backend Engineer Node.js) ---
  {
    id: 11, job_sourcing_id: 7, name: 'Kevin Wijaya', last_position: 'Senior Backend Engineer',
    address: 'Singapore', education: "Bachelor's in Computer Science",
    information: {
      job_position: { current: 'Senior Backend Engineer', category: 'Backend' },
      skills: ['Node.js', 'Go', 'Kubernetes', 'PostgreSQL', 'AWS', 'Docker', 'Redis'],
      education: [
        { school: 'Nanyang Technological University', degree: "Bachelor's in Computer Science", year: 2016, tier: 'top' },
      ],
      experience: {
        years_total: 9,
        positions: [
          { title: 'Senior Backend Engineer', company: 'Sea Group', years: 4 },
          { title: 'Backend Engineer', company: 'Lazada', years: 3 },
          { title: 'Junior Backend Engineer', company: 'Carousell', years: 2 },
        ],
      },
    },
    date: '2026-03-18 09:05:00', attachment: null,
  },
  {
    id: 12, job_sourcing_id: 7, name: 'Laras Wulandari', last_position: 'Backend Developer',
    address: 'Manila, Philippines', education: "Bachelor's in Information Technology",
    information: {
      job_position: { current: 'Backend Developer', category: 'Backend' },
      skills: ['Node.js', 'Express', 'MongoDB', 'JavaScript', 'REST'],
      education: [
        { school: 'University of the Philippines', degree: "Bachelor's in Information Technology", year: 2023, tier: 'top' },
      ],
      experience: {
        years_total: 2,
        positions: [
          { title: 'Backend Developer', company: 'PayMongo', years: 2 },
        ],
      },
    },
    date: '2026-03-19 12:50:00', attachment: null,
  },
];
