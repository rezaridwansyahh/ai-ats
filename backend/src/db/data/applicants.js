// Dummy applicant seed data tied to seeded job_sourcing entries (ids 1-7)

export default [
  // --- Sourcing 1 (internal / Senior Frontend Engineer) ---
  { id: 1, job_sourcing_id: 1, name: 'Ayu Pratiwi',     email: 'ayu.pratiwi@example.com',     last_position: 'Frontend Engineer',       address: 'Jakarta, Indonesia',     education: "Bachelor's in Computer Science",         information: { years_experience: 4, skills: ['React', 'TypeScript', 'Tailwind'] }, date: '2026-04-05 10:12:00', attachment: null },
  { id: 2, job_sourcing_id: 1, name: 'Budi Santoso',    email: 'budi.santoso@example.com',    last_position: 'UI Engineer',             address: 'Bandung, Indonesia',     education: "Bachelor's in Informatics",              information: { years_experience: 3, skills: ['Vue', 'React'] },                      date: '2026-04-06 09:30:00', attachment: null },

  // --- Sourcing 2 (internal / Product Designer) ---
  { id: 3, job_sourcing_id: 2, name: 'Citra Lestari',   email: 'citra.lestari@example.com',   last_position: 'Senior Product Designer', address: 'Singapore',              education: "Bachelor's in Design",                   information: { years_experience: 6, skills: ['Figma', 'Design Systems'] },            date: '2026-04-07 14:20:00', attachment: null },

  // --- Sourcing 3 (seek / Senior Frontend Engineer) ---
  { id: 4, job_sourcing_id: 3, name: 'Dewi Anggraini',  email: 'dewi.anggraini@example.com',  last_position: 'Frontend Developer',      address: 'Jakarta, Indonesia',     education: "Bachelor's in Computer Science",         information: { years_experience: 5, skills: ['React', 'Next.js', 'GraphQL'] },        date: '2026-04-08 11:05:00', attachment: null },
  { id: 5, job_sourcing_id: 3, name: 'Eko Nugroho',     email: 'eko.nugroho@example.com',     last_position: 'React Engineer',          address: 'Surabaya, Indonesia',    education: "Diploma in Software Engineering",        information: { years_experience: 2, skills: ['React', 'Redux'] },                     date: '2026-04-09 08:45:00', attachment: null },
  { id: 6, job_sourcing_id: 3, name: 'Fitri Handayani', email: 'fitri.handayani@example.com', last_position: 'Software Engineer',       address: 'Yogyakarta, Indonesia',  education: "Bachelor's in Computer Engineering",     information: { years_experience: 7, skills: ['React', 'Node.js', 'AWS'] },            date: '2026-04-09 16:00:00', attachment: null },

  // --- Sourcing 4 (seek / Backend Engineer Node.js) ---
  { id: 7, job_sourcing_id: 4, name: 'Gilang Ramadhan', email: 'gilang.ramadhan@example.com', last_position: 'Backend Engineer',        address: 'Bali, Indonesia',        education: "Bachelor's in Computer Science",         information: { years_experience: 4, skills: ['Node.js', 'PostgreSQL', 'Docker'] },    date: '2026-04-10 09:20:00', attachment: null },
  { id: 8, job_sourcing_id: 4, name: 'Hana Putri',      email: 'hana.putri@example.com',      last_position: 'Full-Stack Engineer',     address: 'Denpasar, Indonesia',    education: "Bachelor's in Information Systems",      information: { years_experience: 3, skills: ['Node.js', 'React', 'MongoDB'] },        date: '2026-04-11 10:10:00', attachment: null },

  // --- Sourcing 5 (seek / Talent Acquisition Specialist) — Draft, no applicants yet ---

  // --- Sourcing 6 (linkedin / Senior Frontend Engineer) ---
  { id: 9,  job_sourcing_id: 6, name: 'Irfan Maulana',   email: 'irfan.maulana@example.com',   last_position: 'Frontend Lead',           address: 'Jakarta, Indonesia',     education: "Master's in Software Engineering",       information: { years_experience: 8, skills: ['React', 'TypeScript', 'Architecture'] }, date: '2026-04-09 13:40:00', attachment: null },
  { id: 10, job_sourcing_id: 6, name: 'Julia Saputra',   email: 'julia.saputra@example.com',   last_position: 'Frontend Engineer',       address: 'Kuala Lumpur, Malaysia', education: "Bachelor's in Computer Science",         information: { years_experience: 4, skills: ['React', 'Tailwind', 'Jest'] },          date: '2026-04-10 15:25:00', attachment: null },

  // --- Sourcing 7 (linkedin / Backend Engineer Node.js) ---
  { id: 11, job_sourcing_id: 7, name: 'Kevin Wijaya',    email: 'kevin.wijaya@example.com',    last_position: 'Senior Backend Engineer', address: 'Singapore',              education: "Bachelor's in Computer Science",         information: { years_experience: 9, skills: ['Node.js', 'Go', 'Kubernetes'] },        date: '2026-03-18 09:05:00', attachment: null },
  { id: 12, job_sourcing_id: 7, name: 'Laras Wulandari', email: 'laras.wulandari@example.com', last_position: 'Backend Developer',       address: 'Manila, Philippines',    education: "Bachelor's in Information Technology",   information: { years_experience: 2, skills: ['Node.js', 'Express'] },                 date: '2026-03-19 12:50:00', attachment: null },

  { id: 13, job_sourcing_id: 7, name: 'email-tester', email: 'dpuppet001@gmail.com', last_position: 'Junior Backend Developer',       address: 'Indonesia',    education: "Bachelor's in Information Technology",   information: { years_experience: 2, skills: ['Node.js', 'Express'] },                 date: '2026-03-19 12:50:00', attachment: null },
  { id: 14, job_sourcing_id: 7, name: 'email-tester 2', email: 'mluthfinaufal99@gmail.com', last_position: 'Full Stack Developer',       address: 'Indonesia',    education: "Bachelor's in Information Technology",   information: { years_experience: 2, skills: ['Node.js', 'Express'] },                 date: '2026-03-19 12:50:00', attachment: null },
];
