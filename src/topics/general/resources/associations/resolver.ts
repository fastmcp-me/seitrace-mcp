// Resolver for shaping association responses from the Chain Gateway

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpResponse } from '../../../../utils/index.js';

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

/**
 * Represents a single mapping entry in the association response.
 */
export interface AssociationMappingItem {
  evm_hash?: string;
  sei_hash?: string;
  type?: string;
  pointer?: string;
  pointee?: string;
}

/**
 * Represents a single association entry in the response.
 */
export interface AssociationEntry {
  hash?: string;
  mappings: AssociationMappingItem[];
}

/**
 * Resolver for shaping association responses from the Chain Gateway
 * @param result
 * @returns CallToolResult
 */
export function associationsResolver(result: CallToolResult): CallToolResult {
  const text: string = result.content[0].text as string;

  if (text.includes('error')) {
    return McpResponse(JSON.stringify({ error: text }));
  }

  const match = text.match(/\n([\s\S]*)$/);
  const jsonPart = match ? match[1] : text;
  const parsed = JSON.parse(jsonPart);
  const arr = Array.isArray(parsed) ? parsed : [];

  /**
   * Shape the association entry.
   */
  const shaped = arr.map((entry: any) => {
    const hash = entry?.hash;
    const mappings = Array.isArray(entry?.mappings) ? entry.mappings : [];
    const simplified = mappings.map((m: any) => {
      const item: AssociationMappingItem = {
        evm_hash: m?.evm_hash,
        sei_hash: m?.sei_hash,
        type: m?.type,
      };
      if (SEI_POINTER_TYPES.has(m?.type)) {
        item.pointer = m?.evm_hash;
        item.pointee = m?.sei_hash;
      } else if (EVM_POINTER_TYPES.has(m?.type)) {
        item.pointer = m?.sei_hash;
        item.pointee = m?.evm_hash;
      }
      return item;
    });
    return { hash, mappings: simplified };
  });

  /**
   * Shape the association response.
   */
  return McpResponse(JSON.stringify(shaped));
}
