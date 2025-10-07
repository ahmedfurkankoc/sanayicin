'use client'

import BlogEditor from '../../new/page'

export default function EditBlogPost({ params }: { params: { id: string } }) {
  return <BlogEditor params={params} />
}
