import Component from '@ember/component';
import moment from 'moment';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { set } from '@ember/object';
import { later } from '@ember/runloop';

export default Component.extend({

    timeEntryService: inject('time-entry-service'),
    init() {
        this._super(...arguments);
        this.set("options", {
            plugins: ["autolink", "link", "autoresize"],
            menubar: false,
            //statusbar: false,
            toolbar: false,
            default_link_target: "_blank",
            toolbar: "link code",
            link_context_toolbar: true,
            link_title: false
        });
    },

    isEditable: computed("forUserId", "loggedinUser", function () {
        let foruser = this.get('forUserId');
        let loggedinUserId = this.get('loggedinUser.requestorId');
        let loggedinUserRole = this.get('loggedinUser.role');
        return (loggedinUserRole === "Administrator" || foruser === loggedinUserId);

    }),
    didReceiveAttrs() {
        this._super(...arguments);
        let foruser = this.get('forUserId');
        this.get('timeEntryService').getUserProjects(foruser)
            .then(results => {
                this.set('projects', results);
            });
        this.getDataforTime();
        this.set("lastUpdatedDateime", Date.now())

    },

    didUpdateAttrs() {
        this.getDataforTime();
    },


    timelogsview: computed("timelogs.@each", function () {

        return this.get("timelogs");
    }),

    getDataforTime() {

        let period = this.get("period");
        let userid = this.get('forUserId');
        let fromdate;
        let todate;

        if (period === "custom") {
            let start = moment(this.get('fromDate'));
            let end = moment(this.get('toDate'))

            fromdate = start.clone().format('X');
            todate = end.clone().format('X');

            let startdate = start.clone().format("MM/DD/YYYY");

            let enddate = end.clone().format("MM/DD/YYYY");

            this.set("perioddates", `custom range [ ${startdate} to ${enddate}]`);

        }
        else {
            let start = moment().startOf("week");

            fromdate = start.clone().format('X');
            todate = start.clone().add(7, 'days').format('X');

            let startdate = start.clone().format("MM/DD/YYYY");
            let enddate = start.clone().add(1, 'week').format("MM/DD/YYYY");

            this.set("perioddates", `current week [ ${startdate} to ${enddate}]`);

        }

        this.get('timeEntryService').getTimeEntriesForPeriod(userid, fromdate, todate)
            .then(results => { this.set('timelogs', results) });
    },



    actions: {

        saveEditsToTimelog(timelog) {

            let toastr = this.get("toast");

            this.get('timeEntryService').updateTimeEntry(timelog._id, timelog).then(
                () => {
                    toastr.success("Edits Successfully saved");
                    this.set('isFormSubmitted', "");
                    this.get("notifyController")(Date.now())
                },
                error => { toastr.error("", error); })

        },

        deleteTimelog(timelog) {
            if (confirm("Are you sure you want to delete this entry")) {
                let toastr = this.get('toast');
                this.get('timeEntryService').deleteTimeEntry(timelog._id)
                    .then(() => {

                        this.get('timelogs').removeObject(timelog);
                        toastr.success("Time Entry Succesfully Removed");
                        this.get("notifyController")(Date.now())
                    },
                        error => { toastr.error("", error); }
                    )
            }
        }
    }


});
