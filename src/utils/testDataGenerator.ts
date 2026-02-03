export function generateRandomString(length: number = 8): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateRandomEmail(prefix: string = 'test'): string {
  return `${prefix}-${generateRandomString(8)}@test.com`;
}

export function generateRandomUsername(prefix: string = 'user'): string {
  return `${prefix}-${generateRandomString(8)}`;
}

export function generateRandomArticleTitle(prefix: string = 'Article'): string {
  return `${prefix} ${generateRandomString(6)}`;
}

export function generateRandomArticleDescription(): string {
  return `This is a test article description ${generateRandomString(10)}`;
}

export function generateRandomArticleBody(): string {
  return `This is the body of the test article.\n\nIt contains multiple paragraphs and some **markdown** formatting.\n\nRandom content: ${generateRandomString(20)}`;
}

export function generateRandomComment(): string {
  return `This is a test comment ${generateRandomString(10)}`;
}

export function generateRandomTag(prefix: string = 'tag'): string {
  return `${prefix}${generateRandomString(4)}`;
}

export function generateRandomTags(count: number = 3): string[] {
  const tags: string[] = [];
  for (let i = 0; i < count; i++) {
    tags.push(generateRandomTag());
  }
  return tags;
}

export function generateTimestamp(): string {
  return Date.now().toString(36);
}

export function generateUniqueId(): string {
  return `${generateTimestamp()}-${generateRandomString(4)}`;
}
