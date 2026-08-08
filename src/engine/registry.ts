import { bestTimeToBuySellStock } from './algorithms/bestTimeToBuySellStock';
import { bubbleSort } from './algorithms/bubbleSort';
import { binaryTreeMaxPathSum } from './algorithms/binaryTreeMaxPathSum';
import { climbingStairs } from './algorithms/climbingStairs';
import { coinChange } from './algorithms/coinChange';
import { constructTreeFromTraversals } from './algorithms/constructTreeFromTraversals';
import { containerWithMostWater } from './algorithms/containerWithMostWater';
import { containsDuplicate } from './algorithms/containsDuplicate';
import { countingBits } from './algorithms/countingBits';
import { decodeWays } from './algorithms/decodeWays';
import { encodeDecodeStrings } from './algorithms/encodeDecodeStrings';
import { findMedianFromDataStream } from './algorithms/findMedianFromDataStream';
import { findMinRotated } from './algorithms/findMinRotated';
import { groupAnagrams } from './algorithms/groupAnagrams';
import { houseRobber } from './algorithms/houseRobber';
import { houseRobberII } from './algorithms/houseRobberII';
import { invertBinaryTree } from './algorithms/invertBinaryTree';
import { jumpGame } from './algorithms/jumpGame';
import { kthSmallestBST } from './algorithms/kthSmallestBST';
import { lcaOfBST } from './algorithms/lcaOfBST';
import { levelOrderTraversal } from './algorithms/levelOrderTraversal';
import { longestConsecutive } from './algorithms/longestConsecutive';
import { longestIncreasingSubsequence } from './algorithms/longestIncreasingSubsequence';
import { longestPalindromicSubstring } from './algorithms/longestPalindromicSubstring';
import { longestRepeatingCharacterReplacement } from './algorithms/longestRepeatingCharacterReplacement';
import { longestSubstringWithoutRepeating } from './algorithms/longestSubstringWithoutRepeating';
import { linkedListCycle } from './algorithms/linkedListCycle';
import { maxDepthBinaryTree } from './algorithms/maxDepthBinaryTree';
import { maxProductSubarray } from './algorithms/maxProductSubarray';
import { maximumSubarray } from './algorithms/maximumSubarray';
import { mergeKSortedLists } from './algorithms/mergeKSortedLists';
import { mergeTwoSortedLists } from './algorithms/mergeTwoSortedLists';
import { minimumWindowSubstring } from './algorithms/minimumWindowSubstring';
import { missingNumber } from './algorithms/missingNumber';
import { numberOfOneBits } from './algorithms/numberOfOneBits';
import { palindromicSubstrings } from './algorithms/palindromicSubstrings';
import { productExceptSelf } from './algorithms/productExceptSelf';
import { removeNthFromEnd } from './algorithms/removeNthFromEnd';
import { reorderList } from './algorithms/reorderList';
import { reverseBits } from './algorithms/reverseBits';
import { reverseLinkedList } from './algorithms/reverseLinkedList';
import { sameTree } from './algorithms/sameTree';
import { serializeDeserializeTree } from './algorithms/serializeDeserializeTree';
import { subtreeOfAnotherTree } from './algorithms/subtreeOfAnotherTree';
import { searchRotated } from './algorithms/searchRotated';
import { sumOfTwoIntegers } from './algorithms/sumOfTwoIntegers';
import { threeSum } from './algorithms/threeSum';
import { topKFrequent } from './algorithms/topKFrequent';
import { twoSum } from './algorithms/twoSum';
import { validAnagram } from './algorithms/validAnagram';
import { validateBST } from './algorithms/validateBST';
import { validParentheses } from './algorithms/validParentheses';
import { validPalindrome } from './algorithms/validPalindrome';
import { wordBreak } from './algorithms/wordBreak';
import type { AlgorithmDef } from './types';

/**
 * Every algorithm the picker knows about, in Blind 75 section order.
 * New algorithms land here.
 */
export const algorithms: AlgorithmDef[] = [
  // Arrays & Hashing
  containsDuplicate,
  validAnagram,
  twoSum,
  groupAnagrams,
  topKFrequent,
  encodeDecodeStrings,
  productExceptSelf,
  longestConsecutive,
  // Two Pointers
  validPalindrome,
  threeSum,
  containerWithMostWater,
  // Sliding Window
  bestTimeToBuySellStock,
  longestSubstringWithoutRepeating,
  longestRepeatingCharacterReplacement,
  minimumWindowSubstring,
  // Stack
  validParentheses,
  // Binary Search
  findMinRotated,
  searchRotated,
  // Linked List
  reverseLinkedList,
  mergeTwoSortedLists,
  linkedListCycle,
  reorderList,
  removeNthFromEnd,
  mergeKSortedLists,
  // Trees
  invertBinaryTree,
  maxDepthBinaryTree,
  sameTree,
  subtreeOfAnotherTree,
  lcaOfBST,
  levelOrderTraversal,
  validateBST,
  kthSmallestBST,
  constructTreeFromTraversals,
  binaryTreeMaxPathSum,
  serializeDeserializeTree,
  // Heap / Priority Queue
  findMedianFromDataStream,
  // 1-D Dynamic Programming
  climbingStairs,
  houseRobber,
  houseRobberII,
  longestPalindromicSubstring,
  palindromicSubstrings,
  decodeWays,
  coinChange,
  maxProductSubarray,
  wordBreak,
  longestIncreasingSubsequence,
  // Greedy
  maximumSubarray,
  jumpGame,
  // Bit Manipulation
  numberOfOneBits,
  countingBits,
  reverseBits,
  missingNumber,
  sumOfTwoIntegers,
  // Extras outside the Blind 75
  bubbleSort,
];

export function algorithmById(id: string): AlgorithmDef {
  return algorithms.find((a) => a.id === id) ?? algorithms[0];
}

/** Algorithms grouped by category, in registry order. */
export function groupedAlgorithms(): [string, AlgorithmDef[]][] {
  const groups = new Map<string, AlgorithmDef[]>();
  for (const algo of algorithms) {
    const list = groups.get(algo.category) ?? [];
    list.push(algo);
    groups.set(algo.category, list);
  }
  return [...groups.entries()];
}
