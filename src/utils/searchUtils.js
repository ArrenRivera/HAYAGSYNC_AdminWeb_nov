// Levenshtein distance algorithm for typo tolerance
export function levenshteinDistance(a, b) {
  if (!a || !b) return (a || '').length + (b || '').length;
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Typo-tolerant student search across name, LRN, grade, section
export function searchStudents(students, query, maxResults = 8) {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  const scored = students.map((student) => {
    const name = student.name.toLowerCase();
    const lrn = (student.lrn || '').toLowerCase();
    const section = (student.section || '').toLowerCase();
    const grade = (student.grade || '').toLowerCase();

    let score = 0;

    // Exact or substring match (Highest priority)
    if (name === q || lrn === q) score += 100;
    else if (name.startsWith(q) || lrn.startsWith(q)) score += 80;
    else if (name.includes(q)) score += 60;
    else if (lrn.includes(q) || section.includes(q) || grade.includes(q)) score += 40;

    // Fuzzy matching for typos in student name
    const words = name.split(/\s+/);
    let bestWordDist = 99;
    for (const w of words) {
      const dist = levenshteinDistance(w, q);
      if (dist < bestWordDist) bestWordDist = dist;
    }

    if (bestWordDist <= 1) score += 35;
    else if (bestWordDist <= 2 && q.length > 3) score += 20;

    return { student, score };
  });

  return scored
    .filter((item) => item.score > 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.student);
}
