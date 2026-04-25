// Each entry: { alias, canonical }. `alias` is stored lowercase — lookup is case-insensitive.
// Canonical form preserves the typical brand casing (e.g. "Node.js", "AWS").
// New aliases can be added at runtime via the master_skill_alias table; this file seeds initial values.

export default [
  { alias: 'reactjs', canonical: 'React' },
  { alias: 'react.js', canonical: 'React' },
  { alias: 'react js', canonical: 'React' },
  { alias: 'react', canonical: 'React' },

  { alias: 'nextjs', canonical: 'Next.js' },
  { alias: 'next.js', canonical: 'Next.js' },
  { alias: 'next js', canonical: 'Next.js' },

  { alias: 'nodejs', canonical: 'Node.js' },
  { alias: 'node.js', canonical: 'Node.js' },
  { alias: 'node js', canonical: 'Node.js' },
  { alias: 'node', canonical: 'Node.js' },

  { alias: 'typescript', canonical: 'TypeScript' },
  { alias: 'ts', canonical: 'TypeScript' },

  { alias: 'javascript', canonical: 'JavaScript' },
  { alias: 'js', canonical: 'JavaScript' },
  { alias: 'es6', canonical: 'JavaScript' },
  { alias: 'ecmascript', canonical: 'JavaScript' },

  { alias: 'vuejs', canonical: 'Vue.js' },
  { alias: 'vue.js', canonical: 'Vue.js' },
  { alias: 'vue', canonical: 'Vue.js' },

  { alias: 'angularjs', canonical: 'Angular' },
  { alias: 'angular.js', canonical: 'Angular' },
  { alias: 'angular', canonical: 'Angular' },

  { alias: 'postgres', canonical: 'PostgreSQL' },
  { alias: 'postgresql', canonical: 'PostgreSQL' },
  { alias: 'psql', canonical: 'PostgreSQL' },

  { alias: 'mongo', canonical: 'MongoDB' },
  { alias: 'mongodb', canonical: 'MongoDB' },

  { alias: 'mysql', canonical: 'MySQL' },
  { alias: 'mariadb', canonical: 'MariaDB' },

  { alias: 'k8s', canonical: 'Kubernetes' },
  { alias: 'kubernetes', canonical: 'Kubernetes' },

  { alias: 'docker', canonical: 'Docker' },

  { alias: 'aws', canonical: 'AWS' },
  { alias: 'amazon web services', canonical: 'AWS' },

  { alias: 'gcp', canonical: 'GCP' },
  { alias: 'google cloud', canonical: 'GCP' },
  { alias: 'google cloud platform', canonical: 'GCP' },

  { alias: 'azure', canonical: 'Azure' },
  { alias: 'microsoft azure', canonical: 'Azure' },

  { alias: 'graphql', canonical: 'GraphQL' },
  { alias: 'rest api', canonical: 'REST' },
  { alias: 'restful', canonical: 'REST' },
  { alias: 'rest', canonical: 'REST' },

  { alias: 'tailwind', canonical: 'Tailwind CSS' },
  { alias: 'tailwindcss', canonical: 'Tailwind CSS' },
  { alias: 'tailwind css', canonical: 'Tailwind CSS' },

  { alias: 'css3', canonical: 'CSS' },
  { alias: 'css', canonical: 'CSS' },
  { alias: 'html5', canonical: 'HTML' },
  { alias: 'html', canonical: 'HTML' },

  { alias: 'sass', canonical: 'Sass' },
  { alias: 'scss', canonical: 'Sass' },

  { alias: 'python', canonical: 'Python' },
  { alias: 'python3', canonical: 'Python' },
  { alias: 'py', canonical: 'Python' },

  { alias: 'golang', canonical: 'Go' },
  { alias: 'go', canonical: 'Go' },

  { alias: 'rust', canonical: 'Rust' },
  { alias: 'java', canonical: 'Java' },
  { alias: 'kotlin', canonical: 'Kotlin' },
  { alias: 'swift', canonical: 'Swift' },
  { alias: 'c#', canonical: 'C#' },
  { alias: 'csharp', canonical: 'C#' },
  { alias: 'c++', canonical: 'C++' },
  { alias: 'cpp', canonical: 'C++' },

  { alias: 'redis', canonical: 'Redis' },
  { alias: 'kafka', canonical: 'Kafka' },
  { alias: 'rabbitmq', canonical: 'RabbitMQ' },

  { alias: 'git', canonical: 'Git' },
  { alias: 'github', canonical: 'GitHub' },
  { alias: 'gitlab', canonical: 'GitLab' },

  { alias: 'ci/cd', canonical: 'CI/CD' },
  { alias: 'cicd', canonical: 'CI/CD' },
  { alias: 'jenkins', canonical: 'Jenkins' },
  { alias: 'github actions', canonical: 'GitHub Actions' },

  { alias: 'ml', canonical: 'Machine Learning' },
  { alias: 'machine learning', canonical: 'Machine Learning' },
  { alias: 'ai', canonical: 'AI' },
  { alias: 'nlp', canonical: 'NLP' },
  { alias: 'tensorflow', canonical: 'TensorFlow' },
  { alias: 'pytorch', canonical: 'PyTorch' },

  { alias: 'figma', canonical: 'Figma' },
  { alias: 'sketch', canonical: 'Sketch' },
  { alias: 'adobe xd', canonical: 'Adobe XD' },

  { alias: 'jira', canonical: 'Jira' },
  { alias: 'confluence', canonical: 'Confluence' },
  { alias: 'agile', canonical: 'Agile' },
  { alias: 'scrum', canonical: 'Scrum' },
];
