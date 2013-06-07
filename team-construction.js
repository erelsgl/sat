/** 
 * == Motivation == 
 *
 * Sometimes, a combinatorical puzzle can be solved using a SAT solver (= a program for solving the logic formula satisfaction problem).
 *
 * Here is the original puzzle I asked in Computer Science Stack Exchange: http://cs.stackexchange.com/questions/12275/team-construction-in-tri-partite-graph
 *
 * Based on a comment by András Salamon, I decided to pose it as a SAT problem.
 * 
 * This program converts an instance of the above puzzle to a CNF formula, in 
 * the format of the MiniSat solver: http://www.dwheeler.com/essays/minisat-user-guide.html
 *
 * == How to use the program: == 
 *
 * > node team-construction.js [NUM-OF-CANDIDATES] > [FILENAME].in
 * > minisat [FILENAME].in > [FILENAME].out
 * 
 * For small values of [NUM-OF-CANDIDATES], minisat will return "SATISFIABLE", which means that it is possible to have a graph with this number of candidates per profession, but without a feasible team.
 * For large enough values of [NUM-OF-CANDIDATES] (how much? that's the question) minisat will return "UNSATISFIABLE", which means that it is not possible to have a graph without a feasible team, i.e., it is always possible to construct a team.
 * 
 * == Algorithm: == 
 * * Each edge in the tri-partite graph is given a distinct number.
 * * Each edge is represented by a variable in the CNF formula.
 * * The CNF formula contains two types of clauses:
 * * 1. "at least one edge" clauses - saying there is at least a single edge between each two groups of three candidates of different professions.
 * * 2. "no cliques" clauses - saying there are no groups of 3 candidates of 3 different professions, such that each candidate is connected to each of the other candidates.
 */

var numProfessions = 3;
var numCandidatesPerProfession = process.argv[2];
var numEdgesBetweenTwoProfessions = Math.pow(numCandidatesPerProfession,2);
var numEdges = numEdgesBetweenTwoProfessions * (numProfessions*(numProfessions-1)/2);

console.warn(numProfessions+" professions, "+numCandidatesPerProfession+" candidates per profession, "+numEdgesBetweenTwoProfessions+" edges between candidates of two professions, "+numEdges+" total edges");


/*******************************************************
 * INDICES
 *
 * Calculate a distinct index for each edge.
 *
 * @note all inputs and most return-values are 0-based.
 */


/** 
 * Calculate a distinct index for a pair of professions.
 * Currently this works only for 3 professions:
 *   0-1 ==> 0
 *   0-2 ==> 1
 *   1-2 ==> 2
 */
function indexOfProfessionPair(profession1, profession2) {
	return profession1 + (profession2-1)
}

/** 
 * Calculate a distinct index for a pair of candidate-indices.
 */
function indexOfCandidatePair(candidate1, candidate2) {
	return candidate1*numCandidatesPerProfession + candidate2;
}

/**
 * @return a distinct index for the edge between the given two candidates of the given two professions.
 * @note here, only, the return value is 1-based, to match DIMACS format.
 */ 
function indexOfEdge(profession1, candidate1, profession2, candidate2) {
	return indexOfProfessionPair(profession1, profession2) * numEdgesBetweenTwoProfessions + indexOfCandidatePair(candidate1, candidate2)
		+ 1;
}

/**
 * A sanity test for the index calculation. Make sure all edges have different indices.
 */
function testEdges() {
	var seenIndices={};
	for (var profession1=0; profession1<numProfessions; ++profession1) {
		for (var profession2=profession1+1; profession2<numProfessions; ++profession2) {
			for (var candidate1=0; candidate1<numCandidatesPerProfession; ++candidate1) {
				for (var candidate2=0; candidate2<numCandidatesPerProfession; ++candidate2) {
					var index = indexOfEdge(profession1, candidate1, profession2, candidate2);
					var message = ("indexOfEdge("+profession1
+","+candidate1+", "+profession2+","+candidate2+")="+index);
					if (seenIndices[index]) {
						throw new Error("Edge "+index+" already seen!\n\t"+message);
					}
					seenIndices[index] = message;
				}
			}
		}
	}
	console.warn("Edge test: OK");
}

testEdges();







/*******************************************************
 * CLAUSES
 *
 */


/**
 * @return a CNF clause in DIMACS format, that guarantees that there is at least one edge among the given sets of candidates.
 */
function atLeastOneEdgeBetweenCandidates(profession1, candidates1, profession2, candidates2) {
	var edges=[];
	for (var c1=0; c1<candidates1.length; ++c1) {
		for (var c2=0; c2<candidates2.length; ++c2) {
			var edge = indexOfEdge(profession1, candidates1[c1], profession2, candidates2[c2]);
			edges.push(edge);
		}
	}
	return (edges.join(" ")+" 0");
}

/**
 * @return CNF clauses in DIMACS format, that guarantee that there is at least one edge among each two triples of candidates from the given two professions.
 */
function atLeastOneEdgeBetweenProfessions(profession1, profession2) {
	var clauses = [];
	for (var c11=0; c11<numCandidatesPerProfession; ++c11)  {
		for (var c12=c11+1; c12<numCandidatesPerProfession; ++c12)  {
			for (var c13=c12+1; c13<numCandidatesPerProfession; ++c13)  {
				for (var c21=0; c21<numCandidatesPerProfession; ++c21)  {
					for (var c22=c21+1; c22<numCandidatesPerProfession; ++c22)  {
						for (var c23=c22+1; c23<numCandidatesPerProfession; ++c23)  {
							clauses.push(
								atLeastOneEdgeBetweenCandidates(
									profession1, [c11,c12,c13], profession2, [c21,c22,c23]));
						}
					}
				}
			}
		}
	}
	return clauses;
}

/**
 * @return CNF clauses in DIMACS format, that guarantee that, for each two triples of candidates, there is at least one edge among them.
 */
function atLeastOneEdge() {
	var clauses = [];
	for (var profession1=0; profession1<numProfessions; ++profession1)  {
		for (var profession2=profession1+1; profession2<numProfessions; ++profession2)  {
			clauses = clauses.concat(
				atLeastOneEdgeBetweenProfessions(
					profession1, profession2));
		}
	}
	return clauses;
}


/**
 * @return a CNF clause in DIMACS format, that guarantees that there is no clique among the given candidates (of different professions)
 */
function noCliqueBetweenCandidates(candidates) {
	var edges=[];
	for (var profession1=0; profession1<numProfessions; ++profession1) {
		for (var profession2=profession1+1; profession2<numProfessions; ++profession2) {
			var candidate1 = candidates[profession1];
			var candidate2 = candidates[profession2];
			var edge = indexOfEdge(profession1, candidate1, profession2, candidate2);
			edges.push(-edge);
		}
	}
	return (edges.join(" ")+" 0");
}


/**
 * @return CNF clauses in DIMACS format, that guarantee that there is no clique among 3 candidates of different professions.
 */
function noClique() {
	var clauses = [];
	for (var c1=0; c1<numCandidatesPerProfession; ++c1) {
		for (var c2=0; c2<numCandidatesPerProfession; ++c2) {
			for (var c3=0; c3<numCandidatesPerProfession; ++c3) {
				clauses.push(noCliqueBetweenCandidates([c1,c2,c3]));
			}
		}
	}
	return clauses;
}



/*******************************************************
 * MAIN PROGRAM
 *
 */

var teamClauses = atLeastOneEdge().concat(noClique())
var numClauses = teamClauses.length;
console.warn(numClauses+" clauses");
console.log("p cnf "+numEdges+" "+numClauses);
for (var c=0; c<teamClauses.length; ++c) {
	console.log(teamClauses[c]);
}
console.warn("Done!");


