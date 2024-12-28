import { CryptoHasher, write } from "bun";
import type { AppRequest } from "../../lib/types.ts";
import type { Upload } from "@prisma/client";
import * as fs from "node:fs/promises";
import * as pt from "node:path";
import { db } from "../../lib/db.ts";
import { omit } from "../../lib/utils.ts";
import { routes } from "../../../../shared/schemas.ts";

type FileData = Omit<Upload, "id"> & { buffer: ArrayBuffer };

export const uploadDir = pt.join(process.cwd(), "uploads");

export async function POST(req: AppRequest): Promise<Response> {
  const formData = await req.formData();
  const files = formData.getAll("file") as File[];
  
  if(files.length === 0) {
    return new Response(null, { status: 400 });
  }
  
  if(!files.every(file => file instanceof File)) {
    return new Response(null, { status: 400 });
  }
  
  const data = await Promise.all(
    files.map(async file => {
      const buffer = await file.arrayBuffer();
      const hash = new CryptoHasher("sha256").update(buffer).digest("hex");
      const mime = file.type;
      const image = file.type.startsWith("image/");
      return { buffer, hash, mime, image } satisfies FileData;
    })
  );
  
  await fs.mkdir(uploadDir, { recursive: true });
  
  const existing = await db.upload.findMany();
  const dupes = existing.filter(
    ({ hash }) => data.some(({ hash: h }) => h === hash)
  );
  const uniqueData = data.filter(
    ({ hash }) => !dupes.some(({ hash: h }) => h === hash)
  );
  const unique = await db.upload.createManyAndReturn({
    data: uniqueData.map(v => omit(v, ["buffer"]))
  });
  
  for(const { hash, buffer } of data) {
    const path = pt.join(uploadDir, hash);
    await write(path, buffer);
  }
  
  return Response.json(
    routes["upload"].parse(
      [...unique, ...dupes]
    )
  );
}