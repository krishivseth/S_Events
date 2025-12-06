import Graph from 'graphology';
import { MessageMetadata } from '../models/ChemistryAnalysis.js';
import { logger } from '../utils/logger.js';

export interface NetworkNode {
  id: string;
  betweenness: number;
  clustering: number;
  degree: number;
}

/**
 * Analyzes social graph structure from message metadata
 * Calculates network centrality metrics
 */
export class GraphAnalyzer {
  private graph: Graph;

  constructor() {
    this.graph = new Graph({ type: 'undirected' });
  }

  /**
   * Build graph from message metadata
   */
  buildGraphFromMessages(messages: MessageMetadata[]): void {
    this.graph.clear();
    logger.info(`Building graph from ${messages.length} messages`);

    // Add nodes and edges
    for (const msg of messages) {
      // Add sender node
      if (!this.graph.hasNode(msg.sender_id)) {
        this.graph.addNode(msg.sender_id);
      }

      // Determine other party
      const otherParty = msg.recipient_id || msg.group_id;
      if (!otherParty) continue;

      // For group conversations, create edges between all participants
      if (msg.group_id) {
        // In a real implementation, we'd need to track all group members
        // For demo, we'll treat group_id as a node and connect sender to it
        if (!this.graph.hasNode(msg.group_id)) {
          this.graph.addNode(msg.group_id);
        }
      } else if (!this.graph.hasNode(otherParty)) {
        this.graph.addNode(otherParty);
      }

      // Add or update edge
      if (this.graph.hasEdge(msg.sender_id, otherParty)) {
        const weight = this.graph.getEdgeAttribute(msg.sender_id, otherParty, 'weight') || 0;
        this.graph.setEdgeAttribute(msg.sender_id, otherParty, 'weight', weight + 1);
      } else {
        this.graph.addEdge(msg.sender_id, otherParty, { weight: 1 });
      }
    }

    logger.info(`Graph built: ${this.graph.order} nodes, ${this.graph.size} edges`);
  }

  /**
   * Calculate network metrics for a specific node
   */
  calculateNodeMetrics(nodeId: string): NetworkNode {
    if (!this.graph.hasNode(nodeId)) {
      return {
        id: nodeId,
        betweenness: 0,
        clustering: 0,
        degree: 0,
      };
    }

    const betweenness = this.calculateBetweennessCentrality(nodeId);
    const clustering = this.calculateClusteringCoefficient(nodeId);
    const degree = this.graph.degree(nodeId);

    return {
      id: nodeId,
      betweenness,
      clustering,
      degree,
    };
  }

  /**
   * Calculate betweenness centrality (simplified version)
   * Measures how often a node appears on shortest paths
   */
  private calculateBetweennessCentrality(nodeId: string): number {
    if (!this.graph.hasNode(nodeId)) return 0;

    const nodes = this.graph.nodes();
    let centrality = 0;
    const pathsThrough = 0;

    // Simplified calculation - in production, use graphology-metrics
    // For demo, approximate based on degree and network position
    const degree = this.graph.degree(nodeId);
    const neighbors = this.graph.neighbors(nodeId);
    
    // Count how many neighbor pairs are not connected (making this node a bridge)
    let bridges = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (!this.graph.hasEdge(neighbors[i], neighbors[j])) {
          bridges++;
        }
      }
    }

    // Normalize by possible pairs
    const possiblePairs = (neighbors.length * (neighbors.length - 1)) / 2;
    const bridgeRatio = possiblePairs > 0 ? bridges / possiblePairs : 0;

    // Combine degree and bridge ratio for centrality estimate
    centrality = (degree / Math.max(this.graph.order, 1)) * (1 + bridgeRatio);

    return Math.min(1, centrality); // Normalize to 0-1
  }

  /**
   * Calculate clustering coefficient
   * Measures how interconnected a node's neighbors are
   * High = tight-knit network, Low = bridge between groups
   */
  private calculateClusteringCoefficient(nodeId: string): number {
    if (!this.graph.hasNode(nodeId)) return 0;

    const neighbors = this.graph.neighbors(nodeId);
    if (neighbors.length < 2) return 0;

    // Count edges between neighbors
    let edgesBetweenNeighbors = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (this.graph.hasEdge(neighbors[i], neighbors[j])) {
          edgesBetweenNeighbors++;
        }
      }
    }

    // Clustering coefficient = actual edges / possible edges
    const possibleEdges = (neighbors.length * (neighbors.length - 1)) / 2;
    return possibleEdges > 0 ? edgesBetweenNeighbors / possibleEdges : 0;
  }

  /**
   * Get all node IDs in the graph
   */
  getNodes(): string[] {
    return this.graph.nodes();
  }

  /**
   * Remove a node from the graph (for privacy/deletion)
   */
  removeNode(nodeId: string): void {
    if (this.graph.hasNode(nodeId)) {
      this.graph.dropNode(nodeId);
      logger.info(`Removed node ${nodeId} from graph`);
    }
  }

  /**
   * Get graph density (how connected the network is)
   */
  getDensity(): number {
    const nodes = this.graph.order;
    if (nodes < 2) return 0;
    
    const possibleEdges = (nodes * (nodes - 1)) / 2;
    const actualEdges = this.graph.size;
    
    return actualEdges / possibleEdges;
  }

  /**
   * Find communities (simplified - groups of tightly connected nodes)
   */
  findCommunities(): Map<string, Set<string>> {
    const communities = new Map<string, Set<string>>();
    const visited = new Set<string>();

    // Simple community detection: DFS to find connected components
    let communityId = 0;

    for (const node of this.graph.nodes()) {
      if (visited.has(node)) continue;

      const community = new Set<string>();
      const stack = [node];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;

        visited.add(current);
        community.add(current);

        for (const neighbor of this.graph.neighbors(current)) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }

      if (community.size > 0) {
        communities.set(`community_${communityId}`, community);
        communityId++;
      }
    }

    return communities;
  }
}

