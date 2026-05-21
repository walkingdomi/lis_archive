export interface Member {
  name: string
  studentId: string
  role: string
  github?: string
  email?: string
}

export const members: Member[] = [
  {
    name: '박도현',
    studentId: '60220311',
    role: '사이트 개발 및 디자인',
    github: 'walkingdomi',
    email: 'dohyun9041@naver.com'
  },
  {
    name: '김○○',
    studentId: '60XXXXXX',
    role: '콘텐츠 업로드',
    github: 'GITHUB유저명'
  },
  {
    name: '이○○',
    studentId: '60XXXXXX',
    role: '콘텐츠 업로드',
    email: 'EMAIL'
  },
  {
    name: '최○○',
    studentId: '60XXXXXX',
    role: '자료 수집',
    github: 'GITHUB유저명',
    email: 'EMAIL'
  }
]
