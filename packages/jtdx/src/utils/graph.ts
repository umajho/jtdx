export function findCircular(graph: Record<string, string>): string[][] {
  const result: string[][] = [];

  const startNodes = Object.keys(graph);
  while (startNodes.length > 0) {
    let node = startNodes.shift()!;
    const visited: string[] = [node];
    while (node in graph) {
      node = graph[node]!;
      startNodes.splice(startNodes.indexOf(node), 1);
      const index = visited.indexOf(node);
      if (index !== -1) {
        result.push(visited.slice(index));
        break;
      } else {
        visited.push(node);
      }
    }
  }

  return result;
}
