/**
 * Result returned by generation passes
 */
export interface PassExecutionResult {
  /** Whether the pass executed successfully */
  success: boolean;
  /** Number of tiles modified by this pass */
  tilesModified: number;
  /** Optional message about pass execution */
  message?: string;
} 