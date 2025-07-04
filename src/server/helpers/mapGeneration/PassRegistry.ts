import { GenerationPass } from './GenerationPass';
import { IceCapPass } from './passes/IceCapPass';
import { OceanBandPass } from './passes/OceanBandPass';
import { GrasslandFillPass } from './passes/GrasslandFillPass';
import { SpawnAllocationPass } from './passes/SpawnAllocationPass';
import { MAP_GENERATION_PASSES } from '../../../shared/constants/mapGeneration.const';

/**
 * Registry for all available map generation passes
 */
export class PassRegistry {
  private static instance: PassRegistry;
  private passes: Map<string, GenerationPass> = new Map();

  private constructor() {
    this.registerDefaultPasses();
  }

  /**
   * Get the singleton instance of the pass registry
   */
  static getInstance(): PassRegistry {
    if (!PassRegistry.instance) {
      PassRegistry.instance = new PassRegistry();
    }
    return PassRegistry.instance;
  }

  /**
   * Register all default generation passes
   */
  private registerDefaultPasses(): void {
    this.registerPass(new IceCapPass());
    this.registerPass(new OceanBandPass());
    this.registerPass(new GrasslandFillPass());
    this.registerPass(new SpawnAllocationPass());
  }

  /**
   * Register a new generation pass
   */
  registerPass(pass: GenerationPass): void {
    this.passes.set(pass.name, pass);
  }

  /**
   * Get a generation pass by name
   */
  getPass(name: string): GenerationPass | undefined {
    return this.passes.get(name);
  }

  /**
   * Get all registered pass names
   */
  getAllPassNames(): string[] {
    return Array.from(this.passes.keys());
  }

  /**
   * Check if a pass is registered
   */
  hasPass(name: string): boolean {
    return this.passes.has(name);
  }

  /**
   * Validate that all passes in a configuration are available
   */
  validatePassConfiguration(passNames: string[]): { valid: boolean; missingPasses: string[] } {
    const missingPasses: string[] = [];
    
    for (const passName of passNames) {
      if (!this.hasPass(passName)) {
        missingPasses.push(passName);
      }
    }

    return {
      valid: missingPasses.length === 0,
      missingPasses,
    };
  }
} 