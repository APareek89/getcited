import {requireActor} from '@/lib/server/auth';
import {json,route,HttpError} from '@/lib/server/http';
import {executionFor,runWithExecution} from '@/lib/server/execution';
import {getThread,getThreadMessages,deleteThread} from '@/lib/db/threads';
import {hydratePlanApprovals} from '@/lib/db/tracker';
type Context={params:Promise<{threadId:string}>};
export const GET=route(async(req:Request,context:Context)=>{const actor=await requireActor(req),{threadId}=await context.params;return runWithExecution(executionFor(actor),async()=>{const thread=await getThread(threadId);if(!thread)throw new HttpError(404,'Thread not found.');return json({thread,messages:await hydratePlanApprovals(await getThreadMessages(threadId))});});});
export const DELETE=route(async(req:Request,context:Context)=>{const actor=await requireActor(req,{write:true}),{threadId}=await context.params;return runWithExecution(executionFor(actor),async()=>{await deleteThread(threadId);return json({ok:true});});});
