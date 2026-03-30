import { Book } from "@/types"
import Image from "next/image"
import Link from "next/link"

function BookCard({ book: { title, author, slug, coverURL, coverColor } }: { book: Book }) {
  return (
    <Link href={`/books/${slug}`}>
      <article className='book-card'>
        <figure className='book-card-figure'>
          <div className='book-card-cover-wrapper'>
            <Image src={coverURL} className='book-card-cover' alt={title} width={133} height={200} />
          </div>

          <figcaption className='book-card-meta'>
            <h3 className='book-card-title'>{title}</h3>
            <p className='book-card-author'>{author}</p>
          </figcaption>
        </figure>
      </article>
    </Link>
  )
}

export default BookCard
