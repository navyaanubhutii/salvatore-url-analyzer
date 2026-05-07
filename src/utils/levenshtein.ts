/**
 * Levenshtein Edit Distance
 *
 * Computes the minimum number of single-character edits (insertions,
 * deletions, or substitutions) required to transform string `a` into `b`.
 *
 * Used by the brand impersonation engine to catch typosquatting
 * variations like "gooogle.com" or "gogle.com".
 *
 * Time complexity: O(m * n) — perfectly acceptable for short domain tokens.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;

  // Build the DP matrix
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};
