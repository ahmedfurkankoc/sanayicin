'use client'

import { use } from 'react'
import BlogEditor from '../../new/page'

export default function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return <BlogEditor params={resolvedParams} />
}
