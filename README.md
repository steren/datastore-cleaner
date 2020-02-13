# datastore-cleaner

Automatically clean up old Google Cloud Datastore entities.

This uses a Cloud Run microservice that is privately invoked every day by a Cloud Scheduler job.
When invoked, it queries your Cloud Datastore for entities that are older than a year and deletes them.
The entity name and attribute containing the date must be provided as parameters.
The number of entities and the time period can be customized.

```text
+-------------------+    +-------------+    +-------------------+
|  Cloud Scheduler  | -> |  Cloud Run  | -> |  Cloud Datastore  |
+-------------------+    +-------------+    +-------------------+
```

## Set up in your project

1. Export your project ID as an environment variable. The rest of this setup assumes this environment variable is set.
    ```sh
    export PROJECT_ID="my-project"
    ```

1. Build into a container image using Cloud Build:

    ```sh
    gcloud builds submit . --tag gcr.io/$PROJECT_ID/datastore-cleaner
    ```

1. Deploy the image to Cloud Run:

    ```sh
    gcloud run deploy datastore-cleaner --image gcr.io/$PROJECT_ID/datastore-cleaner --platform managed --region us-central1 --no-allow-unauthenticated
    ```

1. Create a service account with permission to invoke the Cloud Run service:

    ```sh
    gcloud iam service-accounts create "datastore-cleaner-invoker" \
      --project "${PROJECT_ID}" \
      --display-name "datastore-cleaner-invoker"
    ```

    ```sh
    gcloud run services add-iam-policy-binding "datastore-cleaner" \
      --project "${PROJECT_ID}" \
      --platform "managed" \
      --region "us-central1" \
      --member "serviceAccount:datastore-cleaner-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
      --role "roles/run.invoker"
    ```

1. Create a Cloud Scheduler HTTP job to invoke the microservice every day:
    
    1. Capture the URL of the Cloud Run service:

        ```sh
        export SERVICE_URL=$(gcloud run services describe datastore-cleaner --project ${PROJECT_ID} --platform managed --region us-central1 --format 'value(status.url)')
        ```

    1. Create the job that will run every day at 3am.

        Make sure to replace "myentity" by the name of the Datastore entity you wish to clean up, e.g. "Events".
        And to replace "createdOn" by the attribute that contains the date.

        ```sh
        gcloud scheduler jobs create http "datastore-cleaner-myentity" \
        --uri "${SERVICE_URL}?entity=myentity&attribute=createdOn" \
        --http-method POST \
        --project ${PROJECT_ID} \
        --description "Cleanup myentity" \
        --oidc-service-account-email "datastore-cleaner-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
        --oidc-token-audience "${SERVICE_URL}" \
        --schedule "0 3 * * *"
        ```

    You can create multiple Cloud Scheduler jobs against the same Cloud Run service with different parameters to clean-up different entities.

1. _(Optional)_ Run the scheduled job now:

    ```sh
    gcloud scheduler jobs run "datastore-cleaner-myentity" \
      --project "${PROJECT_ID}"
    ```

    Note: for initial job deployments, you must wait a few minutes before invoking.


## Query parameters

* `entity`: Name of the Datastore entity to cleanup
* `attribute`: Name of the entity attribute that contains 
* `days` (Optional, default: 365): number of days after which the data should be deleted 
* `limit` (Optional, default: 10): number of entities to delete each time the service is invoked.
