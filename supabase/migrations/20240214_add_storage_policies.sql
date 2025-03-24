-- Create storage policies for the study-materials bucket

-- Allow anyone to read files (since bucket is public)
CREATE POLICY "Give public access to study materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'study-materials');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'study-materials');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow users to update their own study materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'study-materials' AND auth.uid() = owner);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete their own study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'study-materials' AND auth.uid() = owner);
