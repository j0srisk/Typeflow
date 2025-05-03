import path from "path";
import type { Metafile } from "esbuild";

// Maps a source file to the set of entry points that depend on it
export class DependencyGraph {
  // file path -> Set of entry points
  private dependents: Map<string, Set<string>> = new Map();

  // entry point -> Set of all input files for that entry
  private entryInputs: Map<string, Set<string>> = new Map();

  // Update the graph with a new metafile for a given entry point
  updateFromMetafile(entry: string, metafile: Metafile) {
    const inputs = new Set<string>();
    for (const input of Object.keys(metafile.inputs)) {
      const resolved = path.resolve(input);
      inputs.add(resolved);
      if (!this.dependents.has(resolved)) {
        this.dependents.set(resolved, new Set());
      }
      this.dependents.get(resolved)!.add(entry);
    }
    this.entryInputs.set(entry, inputs);
  }

  // Remove all references to an entry point (e.g., before a rebuild)
  removeEntry(entry: string) {
    for (const input of this.entryInputs.get(entry) || []) {
      const dependents = this.dependents.get(input);
      if (dependents) {
        dependents.delete(entry);
        if (dependents.size === 0) {
          this.dependents.delete(input);
        }
      }
    }
    this.entryInputs.delete(entry);
  }

  // Given a changed file, return all entry points that depend on it
  getDependents(file: string): Set<string> {
    const resolved = path.resolve(file);
    return new Set(this.dependents.get(resolved) || []);
  }

  // For debugging
  print() {
    for (const [input, entries] of this.dependents.entries()) {
      console.log(input, "=>", Array.from(entries));
    }
  }
}
