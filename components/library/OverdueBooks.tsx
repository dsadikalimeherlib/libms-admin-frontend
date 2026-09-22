import { useEffect, useState } from "react";
import { getMemberDueHistory } from "@/services/books";
import { Loader2, Book as BookIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const OverdueBooks = ({ memberId }: { memberId?: string }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!memberId) {
      setData(null);
      return;
    }
    setLoading(true);
    getMemberDueHistory({ member: memberId })
      .then((res) => {
        setData(res.message);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [memberId]);

  if (!memberId) return null;

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
      </div>
    );
  }

  if (!data || !data.issued_books || data.issued_books.length === 0) {
    return null;
  }

  const overdueBooks = data.issued_books.filter((b: any) => b.is_overdue);

  if (overdueBooks.length === 0) {
    return null; // Or show issued books? The prompt specifically mentioned "Overdue Books"
  }

  return (
    <div className="section-frame bg-white rounded-lg border p-4 shadow-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-700">Overdue Books</h3>
          <span className="px-2.5 py-0.5 rounded-full border border-red-200 text-red-500 text-xs font-semibold">
            {overdueBooks.length} Overdue
          </span>
        </div>
        <Link href={`/admin/reports/overdue?member=${memberId}`} className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1">
          Report <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex overflow-x-auto pb-2 gap-3 snap-x scrollbar-thin">
        {overdueBooks.map((book: any, idx: number) => (
          <div key={idx} className="flex-none w-[160px] rounded-xl border border-gray-200 overflow-hidden snap-start bg-white flex flex-col">
            <div className="bg-slate-500 pt-3 pb-2 px-2 flex flex-col items-center relative rounded-t-xl">
              <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 border border-red-100">
                {book.days_diff}d overdue
              </span>
              <BookIcon className="text-white w-7 h-7 mb-0.5 opacity-90" />
              <span className="text-white text-[9px] font-bold tracking-widest uppercase">BOOK</span>
            </div>
            <div className="bg-slate-600 text-white/90 text-[10px] py-1 px-2 text-center truncate">
              {book.access_no}
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between bg-white rounded-b-xl">
              <h4 className="font-semibold text-sm text-slate-800 line-clamp-2 leading-tight mb-2">
                {book.book_title}
              </h4>
              <p className="text-red-500 text-xs font-medium">
                Due: {book.due_date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
