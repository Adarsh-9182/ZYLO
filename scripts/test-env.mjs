import {config} from 'dotenv';
config({path:'.env.dashboard-test',override:true,quiet:true});
if(!process.env.DATABASE_URL?.includes('zylo_dashboard_test_'))throw Error('Test server requires an isolated test database');
