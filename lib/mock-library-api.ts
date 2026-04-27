import { addDays, differenceInCalendarDays, format, isToday, startOfDay } from "date-fns";

export type AuthUser = {
  id: string;
  name: string;
  role: string;
  branch: string;
};

export type Member = {
  id: string;
  name: string;
  cardNumber: string;
  mobile: string;
  plan: string;
  status: "Active" | "Expired";
};

export type Book = {
  barcode: string;
  accessNo: string;
  title: string;
  author: string;
  language: string;
  volume: string;
};

export type IssuePreviewRow = Book & {
  transactionDate: string;
  dueDate: string;
};

export type TransactionLookup = {
  member: Member;
  row: {
    barcode: string;
    accessNo: string;
    title: string;
    transactionDate: string;
    dueDate: string;
    returnDate: string;
    dueCharges: number;
  };
};

type ActiveTransaction = {
  barcode: string;
  accessNo: string;
  title: string;
  memberId: string;
  transactionDate: string;
  dueDate: string;
};

const delay = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value: string) => value.trim().toLowerCase();

const logins: Array<{ identifier: string[]; password: string; user: AuthUser }> = [
  {
    identifier: ["admin@citylibrary.io", "circulation", "librarian"],
    password: "library123",
    user: {
      id: "usr_01",
      name: "Ananya Rao",
      role: "Senior Librarian",
      branch: "Central Library",
    },
  },
  {
    identifier: ["desk@citylibrary.io", "frontdesk"],
    password: "library123",
    user: {
      id: "usr_02",
      name: "Rafael Mendes",
      role: "Desk Operator",
      branch: "East Wing",
    },
  },
];

const members: Member[] = [
  {
    id: "MBR-1042",
    name: "Priya Sharma",
    cardNumber: "CARD-88421",
    mobile: "9876543210",
    plan: "Annual Premium",
    status: "Active",
  },
  {
    id: "MBR-2088",
    name: "Daniel Brooks",
    cardNumber: "CARD-55102",
    mobile: "9988776655",
    plan: "Quarterly",
    status: "Active",
  },
  {
    id: "MBR-3191",
    name: "Leila Nasser",
    cardNumber: "CARD-77218",
    mobile: "9123409876",
    plan: "Student",
    status: "Active",
  },
];

const books: Book[] = [
  {
    barcode: "BK-10001",
    accessNo: "A-2041",
    title: "The Midnight Library",
    author: "Matt Haig",
    language: "English",
    volume: "Vol. 1",
  },
  {
    barcode: "BK-10002",
    accessNo: "A-2042",
    title: "Atomic Habits",
    author: "James Clear",
    language: "English",
    volume: "Vol. 2",
  },
  {
    barcode: "BK-10003",
    accessNo: "A-3091",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    language: "English",
    volume: "Vol. 1",
  },
  {
    barcode: "BK-10004",
    accessNo: "H-1182",
    title: "The Alchemist",
    author: "Paulo Coelho",
    language: "English",
    volume: "Vol. 4",
  },
];

let activeTransactions: ActiveTransaction[] = [
  {
    barcode: "BK-10003",
    accessNo: "A-3091",
    title: "Sapiens",
    memberId: "MBR-2088",
    transactionDate: addDays(new Date(), -13).toISOString(),
    dueDate: addDays(new Date(), 1).toISOString(),
  },
  {
    barcode: "BK-10004",
    accessNo: "H-1182",
    title: "The Alchemist",
    memberId: "MBR-3191",
    transactionDate: addDays(new Date(), -18).toISOString(),
    dueDate: addDays(new Date(), -2).toISOString(),
  },
];

export const formatDisplayDate = (value: string | Date) => format(new Date(value), "dd MMM yyyy");

const calculateDueCharges = (dueDate: string, onDate = new Date()) => {
  const lateDays = differenceInCalendarDays(startOfDay(onDate), startOfDay(new Date(dueDate)));
  return lateDays > 0 ? lateDays * 2 : 0;
};

export async function authenticateUser({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}) {
  await delay(700);

  const match = logins.find((entry) =>
    entry.identifier.some((value) => normalize(value) === normalize(identifier)),
  );

  if (!match || match.password !== password) {
    throw new Error("Invalid credentials. Try circulation / library123.");
  }

  return {
    token: `mock-jwt-${match.user.id}-${Date.now()}`,
    user: match.user,
  };
}

export async function getDashboardMetrics() {
  await delay(250);

  return {
    activeLoans: activeTransactions.length,
    dueToday: activeTransactions.filter((item) => isToday(new Date(item.dueDate))).length,
    overdueItems: activeTransactions.filter((item) => calculateDueCharges(item.dueDate) > 0).length,
    membersServed: members.length,
  };
}

export async function validateMember(query: string) {
  await delay(480);
  const normalizedQuery = normalize(query);

  const member = members.find(
    (item) =>
      normalize(item.id) === normalizedQuery ||
      normalize(item.mobile) === normalizedQuery ||
      normalize(item.cardNumber) === normalizedQuery,
  );

  if (!member) {
    throw new Error("Member not found. Check member ID, mobile, or card number.");
  }

  if (member.status !== "Active") {
    throw new Error("This membership is inactive.");
  }

  return member;
}

export async function lookupBookByBarcode(barcode: string) {
  await delay(320);
  const normalizedBarcode = normalize(barcode);

  const book = books.find((item) => normalize(item.barcode) === normalizedBarcode);

  if (!book) {
    throw new Error("Book not found for this barcode.");
  }

  if (activeTransactions.some((item) => normalize(item.barcode) === normalizedBarcode)) {
    throw new Error("This book already has an active transaction.");
  }

  return book;
}

export async function issueBooks({
  memberId,
  barcodes,
}: {
  memberId: string;
  barcodes: string[];
}) {
  await delay(900);

  const member = members.find((item) => item.id === memberId);
  if (!member) {
    throw new Error("Selected member is no longer available.");
  }

  const rows = barcodes.map((barcode) => {
    const book = books.find((item) => normalize(item.barcode) === normalize(barcode));

    if (!book) {
      throw new Error(`Book ${barcode} is unavailable.`);
    }

    if (activeTransactions.some((item) => normalize(item.barcode) === normalize(barcode))) {
      throw new Error(`${book.title} already has an active issue.`);
    }

    const transactionDate = new Date();
    const dueDate = addDays(transactionDate, 14);

    activeTransactions = [
      {
        barcode: book.barcode,
        accessNo: book.accessNo,
        title: book.title,
        memberId,
        transactionDate: transactionDate.toISOString(),
        dueDate: dueDate.toISOString(),
      },
      ...activeTransactions,
    ];

    return {
      ...book,
      transactionDate: transactionDate.toISOString(),
      dueDate: dueDate.toISOString(),
    } satisfies IssuePreviewRow;
  });

  return { member, rows };
}

export async function lookupActiveTransaction(barcode: string): Promise<TransactionLookup> {
  await delay(520);
  const normalizedBarcode = normalize(barcode);

  const transaction = activeTransactions.find((item) => normalize(item.barcode) === normalizedBarcode);
  if (!transaction) {
    throw new Error("No active transaction found for this barcode.");
  }

  const member = members.find((item) => item.id === transaction.memberId);
  if (!member) {
    throw new Error("Member record missing for this transaction.");
  }

  return {
    member,
    row: {
      barcode: transaction.barcode,
      accessNo: transaction.accessNo,
      title: transaction.title,
      transactionDate: transaction.transactionDate,
      dueDate: transaction.dueDate,
      returnDate: new Date().toISOString(),
      dueCharges: calculateDueCharges(transaction.dueDate),
    },
  };
}

export async function completeReturn(barcode: string) {
  await delay(780);
  const normalizedBarcode = normalize(barcode);

  const transactionIndex = activeTransactions.findIndex((item) => normalize(item.barcode) === normalizedBarcode);
  if (transactionIndex === -1) {
    throw new Error("Transaction already closed or unavailable.");
  }

  const [transaction] = activeTransactions.splice(transactionIndex, 1);
  const returnedAt = new Date();
  const dueCharges = calculateDueCharges(transaction.dueDate, returnedAt);

  return {
    accessNo: transaction.accessNo,
    title: transaction.title,
    returnedAt: returnedAt.toISOString(),
    dueCharges,
  };
}

export async function renewBook(barcode: string) {
  await delay(760);
  const normalizedBarcode = normalize(barcode);

  const transaction = activeTransactions.find((item) => normalize(item.barcode) === normalizedBarcode);
  if (!transaction) {
    throw new Error("No valid active transaction found to renew.");
  }

  const renewedDueDate = addDays(new Date(transaction.dueDate), 14);
  transaction.dueDate = renewedDueDate.toISOString();

  return {
    barcode: transaction.barcode,
    dueDate: transaction.dueDate,
    returnDate: new Date().toISOString(),
    dueCharges: calculateDueCharges(transaction.dueDate),
  };
}
