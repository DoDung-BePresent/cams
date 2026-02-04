import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '@/features/admin/types/branchTypes';

type BranchState = {
  currentBranch: Branch | null;
  assignedBranches: Branch[];
  isLoading: boolean;
  error: string | null;
};

type BranchActions = {
  setCurrentBranch: (branch: Branch) => void;
  setAssignedBranches: (branches: Branch[]) => void;
  switchBranch: (branchId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

type BranchStore = BranchState & BranchActions;

const initialState: BranchState = {
  currentBranch: null,
  assignedBranches: [],
  isLoading: false,
  error: null,
};

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentBranch: (branch) => set({ currentBranch: branch }),

      setAssignedBranches: (branches) => {
        set({ assignedBranches: branches });

        // Auto-select first branch if no current branch
        const { currentBranch } = get();
        if (!currentBranch && branches.length > 0) {
          set({ currentBranch: branches[0] });
        }
      },

      switchBranch: (branchId) => {
        const { assignedBranches } = get();
        const branch = assignedBranches.find((b) => b.id === branchId);
        if (branch) {
          set({ currentBranch: branch });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'branch-storage',
      partialize: (state) => ({
        currentBranch: state.currentBranch,
      }),
    },
  ),
);
