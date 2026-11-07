// Devsign affinity map, read from the team's FigJam board (file 8ngtScpL7nN759uai1sZz2,
// Empathise page): "Affinity Mapping" 322:6049 (Korean) and "Affinity Mapping · EN"
// 1842:14359. Every sticky is one statement from the four interviews. The board colours
// stickies by type of statement, sorts them into sub-groups under seven themes and closes
// each theme on an Insight. Nothing here is made up:
// - `types` / `people` hold one character per sticky, in the board's own order inside each
//   sub-group (top to bottom, left to right): p pain point, n need, a behavior,
//   t perception, f emotion (the sticky colour); 1-4 = P01-P04 (the tag on the sticky).
// - `insight` is the board's Insight for the theme (EN from the EN section).
// - `quotes` are stickies quoted verbatim (type tags and the participant tag removed),
//   picked by index in the theme's order; the EN section keeps the same order.
// Sub-group names exist on the Korean board only; the English ones are translations.

export type Locale = "ko" | "en";
type L = Record<Locale, string>;

export type AffSub = { name: L; types: string; people: string };
export type AffTheme = { name: L; insight: L; subs: AffSub[]; quotes: { text: L; who: string }[] };

export const AFF_TYPE_ORDER = ["p", "n", "a", "t", "f"] as const;
export const AFF_TYPE_COLOR: Record<string, string> = { p: "#ffafa3", n: "#a8daff", a: "#b3efbd", t: "#ffe299", f: "#d3bdff" };
export const AFF_TYPE_NAME: Record<string, L> = {
  p: { ko: "페인포인트", en: "Pain point" },
  n: { ko: "니즈", en: "Need" },
  a: { ko: "행동", en: "Behavior" },
  t: { ko: "인식", en: "Perception" },
  f: { ko: "감정", en: "Emotion" },
};
export const AFF_PEOPLE: Record<string, L> = {
  "1": { ko: "P01 · 디자이너", en: "P01 · Designer" },
  "2": { ko: "P02 · PM", en: "P02 · PM" },
  "3": { ko: "P03 · 디자이너", en: "P03 · Designer" },
  "4": { ko: "P04 · 개발자", en: "P04 · Developer" },
};

export const AFF_THEMES: AffTheme[] = [
  {
    name: { ko: "실시간 협업/소통", en: "Real-time collaboration" },
    insight: {
      ko: "협업의 문제는 단순히 실시간 소통이 부족해서가 아니라, 피드백·정보·의사결정이 작업 맥락과 연결되지 않은 채 분산되는 데 있다.",
      en: "Collaboration breaks not from too little real-time talk, but because feedback, information and decisions scatter, cut off from the work.",
    },
    subs: [
      { name: { ko: "실시간 협업 피드백", en: "Real-time feedback" }, types: "nnptaaaptttaaa", people: "11111111122243" },
      { name: { ko: "정보 정리·공유 구조", en: "Organising and sharing information" }, types: "nppnppa", people: "1112111" },
      { name: { ko: "직군 간 합의·의사결정", en: "Agreeing across roles" }, types: "tnpt", people: "2341" },
    ],
    quotes: [
      { who: "1", text: { ko: "최종물은 사실 나오면은 또 거기에 대한 코멘트를 일일이 개인별로 하나하나씩 해서 다시 수정하는게 뭔가 실시간으로 즉각적으로 공유도 안되고…", en: "Once the final is out, everyone comments on it one by one and we revise. Nothing is shared instantly, you can't point to the spot directly." } },
      { who: "3", text: { ko: "모를 때는 물어보는 게 제일 쉬운 길인 것 같긴 해요.", en: "When you don't know, asking is the easiest way." } },
      { who: "4", text: { ko: "싸운다고 협의가 되는 게 아니고, 누군가 나가면 그 자리를 채우고 다시 적응시키는 데 시간이 듭니다.", en: "Fighting doesn't produce agreement. If someone leaves, it takes time to fill the seat and get them up to speed." } },
    ],
  },
  {
    name: { ko: "버전/시안/최종본 관리", en: "Versions, options & finals" },
    insight: {
      ko: "버전 관리의 핵심은 파일을 저장하는 것이 아니라 ‘어떤 버전이 왜 최종 선택되었는지’를 관리하는 것이다.",
      en: "Version control isn't about saving files. It's about managing which version was chosen as final, and why.",
    },
    subs: [
      { name: { ko: "변경 이력·출처 추적", en: "Tracing changes and sources" }, types: "tppt", people: "1122" },
      { name: { ko: "시안·대안 생성 및 비교", en: "Making and comparing options" }, types: "pnatt", people: "31323" },
      { name: { ko: "산출물 보존·기준본 관리", en: "Keeping the final version" }, types: "tpana", people: "32222" },
    ],
    quotes: [
      { who: "2", text: { ko: "시간이 한 두세 달, 한두 달 지났을 때 내가 근데 이거 어디서 보고 썼지? 하는 적이 좀 있었던 것 같고요.", en: "After two or three months, I'd think: wait, where did I get this from?" } },
      { who: "3", text: { ko: "B안을 따로 저장해놓고 약간 이런 거 자체가 없다고 하더라고요", en: "They said there's no such thing as saving a B option separately." } },
      { who: "1", text: { ko: "그리고 어떻게 수정해서 전후 차이를 바로 클릭 한 번으로 알 수 있고 그런 디테일한 것들", en: "Details like seeing the before-and-after of an edit in one click." } },
    ],
  },
  {
    name: { ko: "맥락 공유", en: "Shared context" },
    insight: {
      ko: "협업에서 필요한 것은 더 많은 정보를 공유하는 것이 아니라, 요구사항·업무 맥락·AI 프롬프트·코드를 하나의 공통 기준으로 연결해 모든 직군이 같은 맥락에서 판단할 수 있게 하는 것이다.",
      en: "What's needed isn't more information, but one shared standard linking requirements, work context, AI prompts and code.",
    },
    subs: [
      { name: { ko: "요구·의사결정 정렬", en: "Aligning on requirements" }, types: "ppppnnf", people: "3311433" },
      { name: { ko: "업무 맥락·공통 기준 공유", en: "Sharing work context and standards" }, types: "nnnnnppppattfa", people: "22244442434323" },
      { name: { ko: "AI 컨텍스트·프롬프트 공유", en: "Sharing AI context and prompts" }, types: "aanntppppnnppaattn", people: "333323234334342333" },
      { name: { ko: "코드 기반 공통 참조", en: "Code as the shared reference" }, types: "ttaataaaa", people: "333313323" },
    ],
    quotes: [
      { who: "3", text: { ko: "저한테 너무 사소한 거여서 말 안 하면 제가 나중에 발견을 하게 되기도 하는 거죠.", en: "If it seems too minor to mention, I sometimes find out about it later." } },
      { who: "3", text: { ko: "이거를 왜 고치려고 하는지 그 배경에 대한 설명이 사실 제일 저한테는 필요했던 것 같아요", en: "What I needed most was the background on why we were changing it." } },
      { who: "4", text: { ko: "개발 룰이 자주 바뀌는데 AI가 변경사항을 못 따라옵니다.", en: "Dev rules change often and AI can't keep up." } },
    ],
  },
  {
    name: { ko: "수동 검토", en: "Manual review" },
    insight: {
      ko: "사용자가 원하는 것은 AI에게 판단을 완전히 맡기는 것이 아니라 ‘판단해야 할 부분을 줄여주는 것’이다.",
      en: "Users don't want to hand judgment fully to AI. They want it to shrink what they have to judge.",
    },
    subs: [
      { name: { ko: "인간의 최종 검증·판단 필요", en: "A person still has to check" }, types: "aaatataptttntp", people: "22222244124124" },
      { name: { ko: "AI 정확도·복잡한 상황 처리의 한계", en: "AI accuracy in complex cases" }, types: "tfapa", people: "22244" },
      { name: { ko: "반복 수정·수동 작업 부담", en: "Repeated fixes by hand" }, types: "pppppftap", people: "311122221" },
    ],
    quotes: [
      { who: "2", text: { ko: "제가 그냥 눈으로 보고 다시 고쳐요.", en: "I just look at it and fix it again myself." } },
      { who: "4", text: { ko: "AI가 80%를 해주더라도 검토는 없어지지 않습니다.", en: "Even if AI does 80%, review doesn't go away." } },
      { who: "1", text: { ko: "AI는 그게 안 되니까 계속 뭔가 수정을 진짜 디테일하게 하나하나씩 쪼개서 해야 된다 그런 느낌?", en: "AI can't do that, so you have to split edits into tiny detailed pieces, one by one." } },
    ],
  },
  {
    name: { ko: "직군 간 경계 흐려짐", en: "Blurred role lines" },
    insight: {
      ko: "AI로 직군 간 실행 영역은 빠르게 겹치고 있지만, 역할과 책임 기준은 이를 따라가지 못하면서 협업 과정의 충돌과 재작업이 발생하고 있다.",
      en: "Roles overlap fast, but ownership hasn't caught up, causing conflicts and rework.",
    },
    subs: [
      { name: { ko: "역할·책임 경계 모호화", en: "Unclear roles and ownership" }, types: "tttttaaaanptfa", people: "23433224343322" },
      { name: { ko: "순차적인 업무 방식에서 협업 중심으로 전환", en: "From hand-offs to working together" }, types: "ttataa", people: "233222" },
      { name: { ko: "개발 선행으로 인한 디자이너 영역 축소", en: "Less room for design when dev goes first" }, types: "tppfpppp", people: "34331333" },
    ],
    quotes: [
      { who: "4", text: { ko: "AI가 들어오면서 디자인·개발 역할 경계가 애매해지고, 누가 UI 구조나 변경을 관리할지 두고 “왜 우리가 해야 하냐”는 충돌이 생깁니다.", en: "With AI, design and dev roles blur, and conflicts arise over who manages UI structure and changes: 'why should we do it?'" } },
      { who: "3", text: { ko: "저희 팀의 주도권이 개발자한테 많이 가있다고 볼 수 있을 것 같아요", en: "On our team, developers hold most of the initiative." } },
      { who: "3", text: { ko: "제가 개입할 수 있는 영역이 조금 저는 오히려 줄어들었다는 느낌을 많이 받아요.", en: "I feel the part where I can step in has actually shrunk." } },
    ],
  },
  {
    name: { ko: "업무 툴 파편화", en: "Tool sprawl" },
    insight: {
      ko: "AI 도구는 이미 업무 전반에 빠르게 확산됐지만, 목적별로 분산 사용되면서 오히려 협업 맥락과 업무 흐름의 파편화를 심화시키고 있다.",
      en: "AI tools scattered by purpose actually break collaboration context and workflow further.",
    },
    subs: [
      { name: { ko: "AI 툴 사용 현황", en: "How AI tools are used" }, types: "aaaaaaaaaaaaaaatptnnt", people: "313312322234222312311" },
      { name: { ko: "업무 툴 파편화", en: "Work spread across tools" }, types: "naptpptppfatattt", people: "2222223123332322" },
    ],
    quotes: [
      { who: "1", text: { ko: "저는 그 노션이랑 깃허브로 체크했어요.", en: "I checked it in Notion and GitHub." } },
      { who: "1", text: { ko: "이걸 각각 쓰면 또 결과 통합이랑 공유하기가 쉽지 않다?", en: "Using each separately makes merging and sharing results hard." } },
      { who: "2", text: { ko: "거기에 모든 내용을 항상 다 넣을 수는 없으니까 다른 툴을 왔다 갔다 해야 되는 불편함은 있죠.", en: "Not everything fits there, so we jump between tools." } },
    ],
  },
  {
    name: { ko: "AI 사용 한계", en: "AI limits" },
    insight: {
      ko: "AI는 반복적이고 명확한 작업에서는 효율적이지만, 복잡한 맥락·예외 상황을 안정적으로 처리하지 못해 결국 사람의 검토와 수정이 필요하다. 비용까지 누적되면서 선택적으로 활용된다.",
      en: "AI works for repetitive, clear tasks, but people still review complex cases. With cost on top, it's used selectively.",
    },
    subs: [
      { name: { ko: "AI 사용 한계", en: "Limits of AI output" }, types: "paptptppppaptpt", people: "441412214344434" },
      { name: { ko: "AI 비용 문제", en: "AI cost" }, types: "pppppt", people: "221112" },
    ],
    quotes: [
      { who: "1", text: { ko: "저희가 원하는 그런 기대값이 사실 AI로 한 번에 나오진 않았어요.", en: "AI never gave us the result we expected in one go." } },
      { who: "3", text: { ko: "가독성이 엄청 좋진 않아요 진짜 좀 말이 길고 장황하고", en: "It's not very readable. Wordy and long-winded." } },
      { who: "2", text: { ko: "새로운 툴이 사실 비용은 제일 많이 늘어난게 클로드 코드도 쓰고 있고 코덱스도 쓰다보니까…", en: "Cost grew the most: Claude Code, Codex, and developers on Max plans." } },
    ],
  },
];

// Which themes the team regrouped into each of the four key problems (same order as
// define.problems.items). AI limits fed none of them.
export const AFF_PROBLEM_THEMES = [[1], [4, 3], [5, 0], [2]];
export const AFF_LEFT_OUT = 6;

export const AFF_UI: Record<Locale, {
  steps: [string, string][]; legend: string; quotes: string; subs: string; insight: string;
  leftOut: string; from: string; pick: string; boardLink: string; statements: string; boardTitle: string; pickProblem: string;
}> = {
  ko: {
    steps: [["201", "인터뷰 발화"], ["7", "테마"], ["4", "문제"]],
    legend: "스티커 하나 = 인터뷰 발화 하나. 색은 보드와 같이 말의 유형이에요.",
    quotes: "실제 발화",
    subs: "소주제",
    insight: "인사이트",
    leftOut: "문제에서 제외",
    from: "묶인 테마",
    pick: "인터뷰 발화 201개를 테마 7개로 묶었어요. 포스트잇을 누르면 아래에서 크게 읽을 수 있어요.",
    boardLink: "실제 보드 보기 ↗",
    statements: "개",
    boardTitle: "테마별 포스트잇 전체",
    pickProblem: "문제를 누르면 어떤 테마에서 왔는지 보여요.",
  },
  en: {
    steps: [["201", "interview statements"], ["7", "themes"], ["4", "problems"]],
    legend: "One sticky = one statement from the interviews. Colour = type of statement, as on the board.",
    quotes: "What they said",
    subs: "Sub-groups",
    insight: "Insight",
    leftOut: "Left out of the problems",
    from: "Themes in it",
    pick: "201 interview statements, grouped into 7 themes. Press a sticky to read it in full below.",
    boardLink: "See the real board ↗",
    statements: "",
    boardTitle: "Every sticky, by theme",
    pickProblem: "Pick a problem to see which themes it came from.",
  },
};
