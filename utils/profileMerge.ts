import { UserProfile } from '../types';

/**
 * Merges two arrays, deduplicating items.
 * For primitive types (strings), uses exact match.
 * For objects, uses the provided dedupKey or JSON stringification.
 */
function mergeArrayField<T>(existing: T[] | undefined, incoming: T[] | undefined, deduplicateKey?: keyof T): T[] {
  const safeExisting = existing || [];
  const safeIncoming = incoming || [];
  
  if (safeIncoming.length === 0) return safeExisting;
  
  const merged = [...safeExisting];
  
  for (const item of safeIncoming) {
    let isDuplicate = false;
    
    if (deduplicateKey && typeof item === 'object' && item !== null) {
        // Deduplicate by specific key (e.g., constraint type + value)
         isDuplicate = merged.some(e => 
            (e as any)[deduplicateKey] === (item as any)[deduplicateKey]
         );
         
         // Special handling for Constraint: check both type AND value if we are looking at constraints
         // This is a bit of a hack to make it generic, ideally we'd have specific logic per type.
         // But for now, let's rely on JSON stringify for complex objects if no key provided,
         // or specific logic if needed.
         // Actually, let's make it simpler: specifically for constraints, we want unique (type, value).
         // For now, let's use deep equality (JSON.stringify) for objects if no key is given, which works for most of our cases.
    } else {
        isDuplicate = merged.some(e => JSON.stringify(e) === JSON.stringify(item));
    }

    if (!isDuplicate) {
      merged.push(item);
    }
  }
  
  return merged;
}

/**
 * Specifically merges constraints, deduping by matching type AND value.
 */
function mergeConstraints(existing: any[], incoming: any[]): any[] {
    const safeExisting = existing || [];
    const safeIncoming = incoming || [];
    const merged = [...safeExisting];

    for (const item of safeIncoming) {
        // Check if a constraint with same type and value exists
        const exists = merged.some(e => e.type === item.type && e.value === item.value);
        if (!exists) {
            merged.push(item);
        }
    }
    return merged;
}

/**
 * Deep merges an incoming profile update into an existing profile.
 * Arrays are appended with deduplication.
 * Scalars are overwritten by the update.
 */
export function mergeProfile(existing: UserProfile, update: Partial<UserProfile>): UserProfile {
  const result = { ...existing };

  // Date info: scalar overwrite (not array append)
  if (update.date_info) {
    result.date_info = update.date_info;
  }

  if (update.needs) {
    result.needs = {
      ...existing.needs,
      ...update.needs,
      // Array fields - explicitly merge
      standards: mergeArrayField(existing.needs.standards, update.needs.standards),
      habits: mergeArrayField(existing.needs.habits, update.needs.habits),
      traits: mergeArrayField(existing.needs.traits, update.needs.traits),
      latent_desires: mergeArrayField(existing.needs.latent_desires, update.needs.latent_desires),
      constraints: mergeConstraints(existing.needs.constraints, update.needs.constraints),
    };
  }

  if (update.goals) {
    result.goals = {
      ...existing.goals,
      ...update.goals,
      // Array fields - explicitly merge
      targets: mergeArrayField(existing.goals.targets, update.goals.targets, 'description'), // Dedup targets by description
      declared_wants: mergeArrayField(existing.goals.declared_wants, update.goals.declared_wants),
      considerations: mergeArrayField(existing.goals.considerations, update.goals.considerations),
      visions: mergeArrayField(existing.goals.visions, update.goals.visions, 'description'), // Dedup visions by description
    };
  }

  return result;
}
