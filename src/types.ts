export enum Role {
  CITIZEN = 'citizen',
  CITIZEN_LEADER = 'citizen_leader',
  CRIMINAL = 'criminal',
  CRIMINAL_LEADER = 'criminal_leader',
}

export interface Player {
  id: string;
  name: string;
  role: Role;
}

export type GamePhase =
  | 'setup'              // Player input and setup
  | 'identity_check'     // Blind checks for players' identities
  | 'president_order'    // Randomly determining president sequence
  | 'round_proposal'     // Jury president proposes jury
  | 'proposal_vote'      // Class votes on proposed jury
  | 'secret_ballot'      // Selected jury votes secretly
  | 'ballot_result'      // Show results of the secret vote
  | 'game_over';         // Sniper phase and final end screen

export interface RoundResult {
  round: number;
  juryPresidentIndex: number;
  juryMembers: number[]; // player indices
  approveVotes: number;
  isApproved: boolean;
  guiltyVotes: number;
  innocentVotes: number;
  result: 'citizen' | 'criminal' | null; // citizen = guilty verdict, criminal = innocent verdict
  memberVotes?: { playerIndex: number; vote: 'guilty' | 'innocent' }[];
}

export interface GameLog {
  timestamp: string;
  category: string;
  message: string;
}

export interface GameState {
  players: Player[];
  rolesAssigned: boolean;
  currentRound: number; // 1 to 5
  phase: GamePhase;
  juryPresidentOrder: number[]; // Array of player indices
  currentPresidentOrderIndex: number; // Index in juryPresidentOrder
  consecutiveRejections: number; // count of consecutive jury proposal rejections in the current round
  currentProposal: number[]; // Selected player indices for jury
  proposalApproveCount: number; // approved votes input by teacher
  votedStatus: { [playerIndex: number]: boolean }; // tracks who has voted in current secret ballot
  currentSecretVotes: ('guilty' | 'innocent')[]; // shuffled votes to maintain absolute anonymity
  activeVoterIndex: number | null; // index of player currently voting (in teacher blind screen)
  roundsHistory: RoundResult[];
  winnerTeam: 'citizen' | 'criminal' | null;
  assassinationStage: boolean; // true if Citizens won 3 trials and Criminals are sniping, OR vice versa
  assassinationTargetIndex: number | null;
  assassinationSuccess: boolean | null;
  finalWinner: 'citizen' | 'criminal' | null;
  logs: GameLog[];
  isShufflingOrder?: boolean;
  tempJuryOrder?: number[];
  activeCheckIndex?: number | null;
  roundTimer?: {
    seconds: number;
    isRunning: boolean;
  };
}
