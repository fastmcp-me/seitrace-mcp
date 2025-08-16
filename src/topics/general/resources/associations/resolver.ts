// Resolver for shaping association responses from the Chain Gateway

// Mapping types partitioned by which side is the pointer
const SEI_POINTER_TYPES = new Set<
  'CREATE_CW20_POINTER' | 'CREATE_CW721_POINTER' | 'CREATE_CW1155_POINTER' | 'CREATE_NATIVE_POINTER'
>([
  'CREATE_CW20_POINTER',
  'CREATE_CW721_POINTER',
  'CREATE_CW1155_POINTER',
  'CREATE_NATIVE_POINTER',
]);
const EVM_POINTER_TYPES = new Set<
  'CREATE_ERC20_POINTER' | 'CREATE_ERC721_POINTER' | 'CREATE_ERC1155_POINTER'
>(['CREATE_ERC20_POINTER', 'CREATE_ERC721_POINTER', 'CREATE_ERC1155_POINTER']);

export interface AssociationMappingItem {
  evm_hash?: string;
  sei_hash?: string;
  type?: string;
  pointer?: string;
  pointee?: string;
}

export interface AssociationEntry {
  hash?: string;
  mappings: AssociationMappingItem[];
}

/**
 * resolveAssociations shapes the raw gateway response into a simplified form.
 * Input shape expectation:
 * [ { hash: string, mappings: [ { evm_hash, sei_hash, type, ... } ] } ]
 */
export function resolveAssociations(raw: any[]): AssociationEntry[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((entry: any) => {
    const hash = entry?.hash;
    const mappings = Array.isArray(entry?.mappings) ? entry.mappings : [];
    const simplified = mappings.map((m: any) => {
      const item: AssociationMappingItem = {
        evm_hash: m?.evm_hash,
        sei_hash: m?.sei_hash,
        type: m?.type,
      };
      if (SEI_POINTER_TYPES.has(m?.type)) {
        item.pointer = m?.sei_hash;
        item.pointee = m?.evm_hash;
      } else if (EVM_POINTER_TYPES.has(m?.type)) {
        item.pointer = m?.evm_hash;
        item.pointee = m?.sei_hash;
      }
      return item;
    });
    return { hash, mappings: simplified };
  });
}
