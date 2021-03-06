import { inject } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({

  projectService: inject('project-service'),
  model(params) {
    return this.get('projectService').getProjectById(params.project_id);
  }
});
