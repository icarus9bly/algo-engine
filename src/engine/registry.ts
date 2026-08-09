import { bestTimeToBuySellStock } from './algorithms/bestTimeToBuySellStock';
import { bubbleSort } from './algorithms/bubbleSort';
import { addAndSearchWords } from './algorithms/addAndSearchWords';
import { alienDictionary } from './algorithms/alienDictionary';
import { binaryTreeMaxPathSum } from './algorithms/binaryTreeMaxPathSum';
import { cloneGraph } from './algorithms/cloneGraph';
import { combinationSum } from './algorithms/combinationSum';
import { courseSchedule } from './algorithms/courseSchedule';
import { climbingStairs } from './algorithms/climbingStairs';
import { coinChange } from './algorithms/coinChange';
import { constructTreeFromTraversals } from './algorithms/constructTreeFromTraversals';
import { containerWithMostWater } from './algorithms/containerWithMostWater';
import { containsDuplicate } from './algorithms/containsDuplicate';
import { countingBits } from './algorithms/countingBits';
import { decodeWays } from './algorithms/decodeWays';
import { encodeDecodeStrings } from './algorithms/encodeDecodeStrings';
import { boatsToSavePeople } from './algorithms/boatsToSavePeople';
import { findMedianFromDataStream } from './algorithms/findMedianFromDataStream';
import { fourSum } from './algorithms/fourSum';
import { findMinRotated } from './algorithms/findMinRotated';
import { graphValidTree } from './algorithms/graphValidTree';
import { groupAnagrams } from './algorithms/groupAnagrams';
import { implementTrie } from './algorithms/implementTrie';
import { insertInterval } from './algorithms/insertInterval';
import { houseRobber } from './algorithms/houseRobber';
import { houseRobberII } from './algorithms/houseRobberII';
import { invertBinaryTree } from './algorithms/invertBinaryTree';
import { jumpGame } from './algorithms/jumpGame';
import { kthSmallestBST } from './algorithms/kthSmallestBST';
import { lcaOfBST } from './algorithms/lcaOfBST';
import { levelOrderTraversal } from './algorithms/levelOrderTraversal';
import { longestCommonSubsequence } from './algorithms/longestCommonSubsequence';
import { longestConsecutive } from './algorithms/longestConsecutive';
import { longestIncreasingSubsequence } from './algorithms/longestIncreasingSubsequence';
import { longestPalindromicSubstring } from './algorithms/longestPalindromicSubstring';
import { longestRepeatingCharacterReplacement } from './algorithms/longestRepeatingCharacterReplacement';
import { longestSubstringWithoutRepeating } from './algorithms/longestSubstringWithoutRepeating';
import { linkedListCycle } from './algorithms/linkedListCycle';
import { maxDepthBinaryTree } from './algorithms/maxDepthBinaryTree';
import { maxProductSubarray } from './algorithms/maxProductSubarray';
import { maximumSubarray } from './algorithms/maximumSubarray';
import { meetingRooms } from './algorithms/meetingRooms';
import { meetingRoomsII } from './algorithms/meetingRoomsII';
import { mergeIntervals } from './algorithms/mergeIntervals';
import { mergeKSortedLists } from './algorithms/mergeKSortedLists';
import { mergeSortedArray } from './algorithms/mergeSortedArray';
import { mergeStringsAlternately } from './algorithms/mergeStringsAlternately';
import { mergeTwoSortedLists } from './algorithms/mergeTwoSortedLists';
import { minimumWindowSubstring } from './algorithms/minimumWindowSubstring';
import { missingNumber } from './algorithms/missingNumber';
import { nonOverlappingIntervals } from './algorithms/nonOverlappingIntervals';
import { numberOfConnectedComponents } from './algorithms/numberOfConnectedComponents';
import { numberOfIslands } from './algorithms/numberOfIslands';
import { numberOfOneBits } from './algorithms/numberOfOneBits';
import { pacificAtlantic } from './algorithms/pacificAtlantic';
import { palindromicSubstrings } from './algorithms/palindromicSubstrings';
import { productExceptSelf } from './algorithms/productExceptSelf';
import { removeDuplicatesSorted } from './algorithms/removeDuplicatesSorted';
import { removeNthFromEnd } from './algorithms/removeNthFromEnd';
import { reorderList } from './algorithms/reorderList';
import { reverseBits } from './algorithms/reverseBits';
import { reverseLinkedList } from './algorithms/reverseLinkedList';
import { reverseString } from './algorithms/reverseString';
import { rotateArray } from './algorithms/rotateArray';
import { rotateImage } from './algorithms/rotateImage';
import { sameTree } from './algorithms/sameTree';
import { serializeDeserializeTree } from './algorithms/serializeDeserializeTree';
import { setMatrixZeroes } from './algorithms/setMatrixZeroes';
import { spiralMatrix } from './algorithms/spiralMatrix';
import { subtreeOfAnotherTree } from './algorithms/subtreeOfAnotherTree';
import { searchRotated } from './algorithms/searchRotated';
import { sumOfTwoIntegers } from './algorithms/sumOfTwoIntegers';
import { threeSum } from './algorithms/threeSum';
import { topKFrequent } from './algorithms/topKFrequent';
import { trappingRainWater } from './algorithms/trappingRainWater';
import { twoSum } from './algorithms/twoSum';
import { twoSumII } from './algorithms/twoSumII';
import { uniquePaths } from './algorithms/uniquePaths';
import { validAnagram } from './algorithms/validAnagram';
import { validateBST } from './algorithms/validateBST';
import { validParentheses } from './algorithms/validParentheses';
import { validPalindrome } from './algorithms/validPalindrome';
import { validPalindromeII } from './algorithms/validPalindromeII';
import { wordBreak } from './algorithms/wordBreak';
import { wordSearch } from './algorithms/wordSearch';
import { wordSearchII } from './algorithms/wordSearchII';
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
  reverseString,
  validPalindrome,
  validPalindromeII,
  mergeStringsAlternately,
  mergeSortedArray,
  removeDuplicatesSorted,
  twoSumII,
  threeSum,
  fourSum,
  rotateArray,
  containerWithMostWater,
  boatsToSavePeople,
  trappingRainWater,
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
  // 2-D Dynamic Programming
  uniquePaths,
  longestCommonSubsequence,
  // Greedy
  maximumSubarray,
  jumpGame,
  // Backtracking
  combinationSum,
  wordSearch,
  // Tries
  implementTrie,
  addAndSearchWords,
  wordSearchII,
  // Graphs
  numberOfIslands,
  cloneGraph,
  pacificAtlantic,
  courseSchedule,
  graphValidTree,
  numberOfConnectedComponents,
  // Advanced Graphs
  alienDictionary,
  // Intervals
  insertInterval,
  mergeIntervals,
  nonOverlappingIntervals,
  meetingRooms,
  meetingRoomsII,
  // Math & Geometry
  rotateImage,
  spiralMatrix,
  setMatrixZeroes,
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
